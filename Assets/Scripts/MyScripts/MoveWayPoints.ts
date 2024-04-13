import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Transform, GameObject, Time, Vector3, Quaternion } from 'UnityEngine'
import GameManager from './GameManager';

export default class MoveWayPoints extends ZepetoScriptBehaviour {
    public wayPointsGroup: GameObject = null;
    private wayPoints: Transform[] = [];

    private speed: float = 2.0;
    private index: int = 0;
    private speedPerTime: float = 0.0;
    
    private relativePos: Vector3 = Vector3.zero;
    private targetRot: Quaternion = Quaternion.identity;
    private rotateWeight: float = 2;

    public isStart: boolean = false;

    private Start(): void {
        if (this.wayPointsGroup != null) {
            this.wayPoints = this.wayPointsGroup.GetComponentsInChildren<Transform>();
            // Parent's Transform
            this.wayPoints.splice(0, 1);
        }
    }

    private FixedUpdate(): void {
        if (!this.isStart) return;

        if (this.wayPointsGroup != null) {
            if (Vector3.op_Subtraction(this.transform.position, this.wayPoints[this.index].position).sqrMagnitude < 0.25) {
                this.index++;
                if (this.index >= this.wayPoints.length) {
                    this.index = 0;
                    this.InitPos();
                }
            }
            this.relativePos = Vector3.op_Subtraction(this.wayPoints[this.index].position, this.transform.position);
            this.targetRot = Quaternion.LookRotation(this.relativePos);
            this.transform.rotation = Quaternion.Lerp(this.transform.rotation, this.targetRot, this.rotateWeight * Time.fixedDeltaTime);
            
            this.speedPerTime = Time.fixedDeltaTime * this.speed;
            this.transform.Translate(Vector3.op_Multiply(Vector3.forward, this.speedPerTime));
        }
    }

    private InitPos(): void
    {
        this.isStart = false;
        this.transform.position = this.wayPoints[this.wayPoints.length - 1].position;
        this.transform.rotation = Quaternion.Euler(0, 180, 0);
    }
}