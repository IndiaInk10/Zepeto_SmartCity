import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

import { Vector3,Quaternion, Transform, WaitForSeconds, Coroutine, Rigidbody } from 'UnityEngine'
import { Button } from 'UnityEngine.UI'
import { NavMeshAgent } from 'UnityEngine.AI'
import GameManager from './GameManager'

enum DroneState
{
    Stop,
    Shipping,
    Arrive,
    Returning,
}

export default class DroneController extends ZepetoScriptBehaviour {

    @SerializeField()
    private callButton: Button = null;

    @SerializeField()
    private target: Transform = null;
    @SerializeField()
    private packageRigid: Rigidbody = null;
    private packageParent: Transform = null;

    private navMesh: NavMeshAgent = null;
    private returnPos: Vector3;

    private state: DroneState = DroneState.Stop;

    private CoStart: Coroutine = null;
    private CoArrive: Coroutine = null;
    private CoReturn: Coroutine = null;

    private Start(): void
    {
        this.returnPos = this.transform.position;
        this.packageParent = this.packageRigid.transform.parent;

        this.navMesh = this.GetComponent<NavMeshAgent>();
        this.callButton.onClick.AddListener(() => this.OnClickCall());
        this.Invoke("SetTarget", 1);
    }

    private SetTarget(): void
    {
        this.target = GameManager.localPlayerTr;
    }
    
    public OnClickCall(): void
    {
        if (this.state == DroneState.Returning) return;

        if (this.target == null)
        {
            this.CancelInvoke();
            this.SetTarget();
        }

        if(this.CoStart != null)  this.StopCoroutine(this.CoStart);
        this.CoStart = this.StartCoroutine(this.CoStartToDelivery());
    }

    private *CoStartToDelivery()
    {
        this.state = DroneState.Shipping;

        this.navMesh.SetDestination(this.target.position);
        yield new WaitForSeconds(0.2);

        if(this.CoArrive != null)  this.StopCoroutine(this.CoArrive);
        this.CoArrive = this.StartCoroutine(this.CoCheckArrive(true));
    }

    private *CoCheckArrive(isShipping: boolean)
    {
        let checkState: DroneState = isShipping ? DroneState.Shipping : DroneState.Returning;

        while (this.state == checkState)
        {
            if (this.navMesh.remainingDistance < 1.25) this.state = DroneState.Arrive;

            yield new WaitForSeconds(0.5);
        }

        if(checkState == DroneState.Shipping)  this.DropPackage();
        else  this.ResetPackage();
    }

    private DropPackage(): void
    {
        this.packageRigid.transform.parent = null;
        this.packageRigid.isKinematic = false;

        if(this.CoReturn != null)  this.StopCoroutine(this.CoReturn);
        this.CoReturn = this.StartCoroutine(this.CoReturnToBase());
    }

    private ResetPackage(): void
    {
        this.state = DroneState.Stop;

        this.transform.position = this.returnPos;
        this.transform.rotation = Quaternion.identity;

        this.packageRigid.transform.SetParent(this.packageParent);
        this.packageRigid.transform.localPosition = Vector3.zero;
        this.packageRigid.transform.localRotation = Quaternion.identity;
        this.packageRigid.isKinematic = true;

        this.packageRigid.gameObject.SetActive(true);
    }

    private *CoReturnToBase()
    {
        this.state = DroneState.Returning;

        this.navMesh.SetDestination(this.returnPos);
        yield new WaitForSeconds(0.1);

        if(this.CoArrive != null)  this.StopCoroutine(this.CoArrive);
        this.CoArrive = this.StartCoroutine(this.CoCheckArrive(false));
    }
}