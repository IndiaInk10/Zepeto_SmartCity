import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

import { Collider, Vector3, Quaternion, Rigidbody, Transform } from 'UnityEngine'
import GameManager from './GameManager'

export default class Box extends ZepetoScriptBehaviour {
    @SerializeField()
    private boxParent: Transform = null;

    private OnTriggerEnter(other: Collider): void
    {
        if (other.gameObject.CompareTag(GameManager.PLAYER))
        {
            this.GetComponent<Rigidbody>().isKinematic = true;
            this.transform.SetParent(this.boxParent);
            this.transform.localPosition = Vector3.zero;
            this.transform.localRotation = Quaternion.identity;

            this.gameObject.SetActive(false);
        }
    }
}