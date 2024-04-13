import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoCamera, ZepetoPlayers } from 'ZEPETO.Character.Controller';

import { Transform, Sprite, AnimationClip, GameObject } from 'UnityEngine'
import { Button, Image } from 'UnityEngine.UI';
import GameManager from './GameManager';
import MoveWayPoints from './MoveWayPoints';

export default class CameraChange extends ZepetoScriptBehaviour {
    @SerializeField()
    private followTarget: Transform = null;

    @SerializeField()
    private sitPos: Transform = null;
    @SerializeField()
    private sitAnim: AnimationClip = null;

    @SerializeField()
    private button: Button = null;
    @SerializeField()
    private sprite: Sprite[] = null;

    @SerializeField()
    private car: GameObject = null;

    private image: Image = null;
    private isRide: boolean = false;

    private Start(): void
    {
        this.image = this.GetComponent<Image>();
        this.button.onClick.AddListener(() => this.OnClickChange());
    }

    public OnClickChange(): void
    {
        this.isRide = !this.isRide;
        let target: Transform = this.isRide ? this.followTarget : GameManager.localPlayerTr;
        let localPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;

        this.image.sprite = this.sprite[Number(this.isRide)];

        if (this.isRide)
        {
            GameManager.isSit = true;
            this.car.GetComponent<MoveWayPoints>().isStart = true;
            for (let i = 0; i < 6; i++) {
                localPlayer.transform.position = this.sitPos.position;
                localPlayer.transform.rotation = this.sitPos.rotation;
            }
            localPlayer.transform.SetParent(this.sitPos);
            localPlayer.SetGesture(this.sitAnim);
        }
        else 
        {
            GameManager.isSit = false;
            localPlayer.transform.parent = null;
            localPlayer.CancelGesture();
        }

        ZepetoPlayers.instance.LocalPlayer.zepetoCamera.SetFollowTarget(target);
    }
}