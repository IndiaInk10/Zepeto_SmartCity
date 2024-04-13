import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay} from 'ZEPETO.World'
import { Room, RoomData} from 'ZEPETO.Multiplay'
import {Player, State, Vector3} from 'ZEPETO.Multiplay.Schema'
import {CharacterState, SpawnInfo, ZepetoPlayers, ZepetoPlayer, CharacterJumpState } from 'ZEPETO.Character.Controller'
import * as UnityEngine from "UnityEngine";
import GameManager from '../../Scripts/MyScripts/GameManager'

export default class ClientStarter extends ZepetoScriptBehaviour {
    public spawnTransform: UnityEngine.Transform;

    public multiplay: ZepetoWorldMultiplay;

    private room: Room;
    private currentPlayers: Map<string, Player> = new Map<string, Player>();

    private zepetoPlayer: ZepetoPlayer;

    private allowablePosDiff : number = 5;

    private Start() {

        this.multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        };

        this.multiplay.RoomJoined += (room: Room) => {
            room.OnStateChange += this.OnStateChange;
        };

        this.StartCoroutine(this.SendMessageLoop(0.03));
    }

    // 일정 Interval Time으로 내(local)캐릭터 transform을 server로 전송합니다.
    private* SendMessageLoop(tick: number) {
        while (true) {
            yield new UnityEngine.WaitForSeconds(tick);

            if (this.room != null && this.room.IsConnected) {
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                if (hasPlayer) {
                    const character = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character;                                  
                    this.SendTransform(character.transform);
                    this.SendState(character.CurrentState);
                }
            }
        }
    }

    private OnStateChange(state: State, isFirst: boolean) {
        // 첫 OnStateChange 이벤트 수신 시, State 전체 스냅샷을 수신합니다.
        if (isFirst) {
            // [CharacterController] (Local)Player 인스턴스가 Scene에 완전히 로드되었을 때 호출
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                const myPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
                myPlayer.character.gameObject.name = myPlayer.id;
                myPlayer.character.gameObject.tag = GameManager.PLAYER;
                GameManager.localPlayerTr = myPlayer.character.transform;
                this.zepetoPlayer = myPlayer;
                
                myPlayer.character.OnChangedState.AddListener((cur, prev) => {
                    this.SendState(cur);
                });
            });

            // [CharacterController] Player 인스턴스가 Scene에 완전히 로드되었을 때 호출
            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
                const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
                character.gameObject.name = sessionId;
                character.gameObject.tag = GameManager.PLAYER;

                const isLocal = this.room.SessionId === sessionId;
                if (!isLocal) {
                    const player: Player = this.currentPlayers.get(sessionId);
                    
                    // [RoomState] player 인스턴스의 state가 갱신될 때마다 호출됩니다.
                    player.OnChange += (changeValues) => this.OnUpdatePlayer(sessionId, player);
                }
            });
        }

        let join = new Map<string, Player>();
        let leave = new Map<string, Player>(this.currentPlayers);

        state.players.ForEach((sessionId: string, player: Player) => {
            if (!this.currentPlayers.has(sessionId)) {
                join.set(sessionId, player);
            }
            leave.delete(sessionId);
        });

        // [RoomState] Room에 입장한 player 인스턴스 생성
        join.forEach((player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player));

        // [RoomState] Room에서 퇴장한 player 인스턴스 제거
        leave.forEach((player: Player, sessionId: string) => this.OnLeavePlayer(sessionId, player));
    }

    private OnJoinPlayer(sessionId: string, player: Player) {
        console.log(`[OnJoinPlayer] players - sessionId : ${sessionId}`);
        this.currentPlayers.set(sessionId, player);

        const spawnInfo = new SpawnInfo();
        // const position = this.ParseVector3(player.transform.position);
        // const rotation = this.ParseVector3(player.transform.rotation);
        // spawnInfo.position = position;
        spawnInfo.position = this.spawnTransform.position;
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(this.spawnTransform.eulerAngles);

        const isLocal = this.room.SessionId === player.sessionId;
        
        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    private OnLeavePlayer(sessionId: string, player: Player) {
        console.log(`[OnRemove] players - sessionId : ${sessionId}`);
        this.currentPlayers.delete(sessionId);

        ZepetoPlayers.instance.RemovePlayer(sessionId);
    }

    private OnUpdatePlayer(sessionId: string, player: Player) {

        let position = this.ParseVector3(player.transform.position);
        
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        
        // Scene에서의 캐릭터의 위치와 서버에서의 캐릭터 위치가 허용값 보다 많이 차이날 경우 Teleport 합니다.
        if (UnityEngine.Vector3.Distance(zepetoPlayer.character.transform.position, position) > this.allowablePosDiff) {
            zepetoPlayer.character.transform.position = position;
            return;
        }

        var moveDir = UnityEngine.Vector3.op_Subtraction(position, zepetoPlayer.character.transform.position);
        moveDir = new UnityEngine.Vector3(moveDir.x, 0, moveDir.z);

        if (moveDir.magnitude < 0.05) {
            if (player.state === CharacterState.MoveTurn)
                return;
            zepetoPlayer.character.StopMoving();
        } else {
            zepetoPlayer.character.MoveContinuously(moveDir);
        }

        if (player.state === CharacterState.Jump) {
            if (zepetoPlayer.character.CurrentState !== CharacterState.Jump) {
                zepetoPlayer.character.Jump();
            }

            if (player.subState === CharacterJumpState.JumpDouble) {
                zepetoPlayer.character.DoubleJump();
            }
        }
            
        zepetoPlayer.character.MoveToPosition(position);
    }

    private SendTransform(transform: UnityEngine.Transform) {
        const data = new RoomData();

        const pos = new RoomData();
        pos.Add("x", transform.localPosition.x);
        pos.Add("y", transform.localPosition.y);
        pos.Add("z", transform.localPosition.z);
        data.Add("position", pos.GetObject());

        const rot = new RoomData();
        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);
        data.Add("rotation", rot.GetObject());
        this.room.Send("onChangedTransform", data.GetObject());
    }

    private SendState(state: CharacterState) {
        const data = new RoomData();
        data.Add("state", state);
        if(state === CharacterState.Jump) { 
            data.Add("subState", this.zepetoPlayer.character.MotionV2.CurrentJumpState);
        }
        this.room.Send("onChangedState", data.GetObject());
    }

    private ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3
        (
            vector3.x,
            vector3.y,
            vector3.z
        );
    }
}