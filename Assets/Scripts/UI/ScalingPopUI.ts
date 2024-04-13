import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoPlayers, ZepetoPlayer, ZepetoCharacter } from 'ZEPETO.Character.Controller';

import { Canvas, Camera, Vector3, Collider, RectTransform, AnimationCurve, SphereCollider, Quaternion, GameObject } from 'UnityEngine'
import GameManager from '../MyScripts/GameManager';

export default class ScalingPopUI extends ZepetoScriptBehaviour
{
    @SerializeField()
    private uiRect: RectTransform = null;
    // @SerializeField()
    // private scalingCurve: AnimationCurve = null;

    // private uiPosition: Vector3 = Vector3.one;
    // private uiLocalScale: Vector3 = Vector3.one;
    private currentPlayer: ZepetoCharacter = null;
    private currentPlayerPosY: Vector3 = Vector3.up;
    // private maxDistance: float = 0.0;

    private cameraOffset: Vector3 = Vector3.up;

    private Start(): void
    {
        // this.maxDistance = this.GetComponent<SphereCollider>().radius;
        // this.uiPosition = new Vector3(this.transform.position.x, 0, this.transform.position.z);
        // this.uiLocalScale = this.uiRect.transform.localScale;
        // this.uiRect.GetComponent<Canvas>().worldCamera = GameObject.FindGameObjectWithTag("LocalCamera").GetComponent<Camera>();
        this.uiRect.GetComponent<Canvas>().worldCamera = GameObject.FindObjectOfType<Camera>();
    }

    // Billboard
    private Update(): void
    {
        if (this.currentPlayer == null) return;

        this.uiRect.transform.parent.LookAt(Vector3.op_Addition(this.currentPlayer.transform.position, this.currentPlayerPosY)); 
        // let distance = Vector3.Distance(this.uiPosition, this.currentPlayer.transform.position);
        // distance /= this.maxDistance;
        // this.uiRect.transform.localScale = Vector3.op_Multiply(this.uiLocalScale, this.scalingCurve.Evaluate(distance) * 10);
    }

    private OnTriggerEnter(other: Collider): void 
    {
        if (this.currentPlayer != null) return;
        if (!other.CompareTag(GameManager.PLAYER)) return;

        this.currentPlayer = ZepetoPlayers.instance.GetPlayer(other.name).character;
        this.SetPosY(this.currentPlayer);
    }

    private OnTriggerExit(other: Collider): void
    {
        // this.uiRect.localScale = this.uiLocalScale;
        this.uiRect.transform.parent.localRotation = Quaternion.identity;
        this.currentPlayer = null;
    }

    private SetPosY(character: ZepetoCharacter): void
    {
        // this.uiPosition.y = character.characterController.height / 2;
        this.currentPlayerPosY = Vector3.op_Addition(this.cameraOffset, Vector3.op_Multiply(Vector3.up, character.characterController.height / 2));
    }
}