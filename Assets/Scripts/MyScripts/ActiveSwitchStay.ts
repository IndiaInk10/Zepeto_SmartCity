import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

import { GameObject, Collider } from 'UnityEngine'

export default class ActiveSwitch extends ZepetoScriptBehaviour {
    @SerializeField()
    private activeObject: GameObject = null;

    private OnTriggerEnter(other: Collider): void
    {
        this.activeObject.SetActive(true);
    }

    private OnTriggerStay(other: Collider): void
    {
        if (this.activeObject.activeSelf) return;
        
        this.activeObject.SetActive(true);
    }

    private OnTriggerExit(other: Collider): void
    {
        this.activeObject.SetActive(false);
    }
}