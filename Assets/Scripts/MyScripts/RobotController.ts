import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

import { Vector3, Transform, Animator, WaitForSeconds, Coroutine, Rigidbody, Quaternion, ForceMode, Debug } from 'UnityEngine'
import { Button } from 'UnityEngine.UI'
import { NavMeshAgent } from 'UnityEngine.AI'
import GameManager from './GameManager'

enum RobotState
{
    Stop = "Stop",
    Shipping = "Shipping",
    Open = "Open",
    Act = "Act",
    Close = "Close", // Close == Stop
    Arrive = "Stop",
    Returning = "Returning",
}

const IDLE: string = "Idle";

export default class RobotController extends ZepetoScriptBehaviour {
    @SerializeField()
    private callButton: Button = null;

    @SerializeField()
    private target: Transform = null;
    @SerializeField()
    private packageRigid: Rigidbody = null;
    private packageParent: Transform = null;

    private navMesh: NavMeshAgent = null;
    private returnPos: Vector3;

    private state: RobotState = RobotState.Stop;
    private animator: Animator = null;

    private CoStart: Coroutine = null;
    private CoArrive: Coroutine = null;
    private CoAnimation: Coroutine = null;
    private CoDrop: Coroutine = null;
    private CoReturn: Coroutine = null;

    private Start(): void
    {
        this.returnPos = this.transform.position;
        this.packageParent = this.packageRigid.transform.parent;

        this.navMesh = this.GetComponent<NavMeshAgent>();
        this.callButton.onClick.AddListener(() => this.OnClickCall());
        this.animator = this.GetComponent<Animator>();
        this.Invoke("SetTarget", 1);
    }

    private SetTarget(): void
    {
        this.target = GameManager.localPlayerTr;
    }
    
    public OnClickCall(): void
    {
        if(this.state == RobotState.Returning)  return;

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
        this.state = RobotState.Shipping;
        this.animator.CrossFade(IDLE, 0);

        this.navMesh.SetDestination(this.target.position);
        yield new WaitForSeconds(0.1);

        if(this.CoArrive != null)  this.StopCoroutine(this.CoArrive);
        this.CoArrive = this.StartCoroutine(this.CoCheckArrive(true));
    }

    private *CoCheckArrive(isShipping: boolean)
    {
        let checkState: RobotState = isShipping ? RobotState.Shipping : RobotState.Returning;

        while (this.state == checkState)
        {
            if (this.navMesh.remainingDistance < 1) this.state = RobotState.Arrive;

            yield new WaitForSeconds(0.5);
        }

        if(checkState == RobotState.Shipping)
        {
            if (this.CoDrop != null) this.StopCoroutine(this.CoDrop);
            this.CoDrop = this.StartCoroutine(this.CoDropPackage());
        }
        else  this.ResetPackage();
    }

    private *CoDoAnimation(nextState: RobotState)
    {
        this.state = RobotState.Act;

        this.animator.CrossFade(nextState, 0);
        yield new WaitForSeconds(0.01);
        yield new WaitForSeconds(this.animator.GetCurrentAnimatorStateInfo(0).length);

        this.state = nextState;
    }

    private *CoDropPackage()
    {
        // Open
        if(this.CoAnimation != null)  this.StopCoroutine(this.CoAnimation);
        this.CoAnimation = this.StartCoroutine(this.CoDoAnimation(RobotState.Open));

        yield new WaitForSeconds(0.01);
        yield new WaitForSeconds(this.animator.GetCurrentAnimatorStateInfo(0).length);

        this.packageRigid.transform.parent = null;
        this.packageRigid.isKinematic = false;
        yield new WaitForSeconds(0.1);
        this.packageRigid.AddForce(Vector3.op_Multiply(this.packageRigid.transform.forward, 4.5), ForceMode.Impulse);

        // Close
        if(this.CoAnimation != null)  this.StopCoroutine(this.CoAnimation);
        this.CoAnimation = this.StartCoroutine(this.CoDoAnimation(RobotState.Close));

        yield new WaitForSeconds(0.01);
        yield new WaitForSeconds(this.animator.GetCurrentAnimatorStateInfo(0).length);

        if(this.CoReturn != null)  this.StopCoroutine(this.CoReturn);
        this.CoReturn = this.StartCoroutine(this.CoReturnToBase());
    }

    private ResetPackage(): void
    {
        this.state = RobotState.Stop;
        this.animator.CrossFade(this.state, 0);

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
        this.state = RobotState.Returning;
        this.animator.CrossFade(IDLE, 0);

        this.navMesh.SetDestination(this.returnPos);
        yield new WaitForSeconds(0.1);

        if(this.CoArrive != null)  this.StopCoroutine(this.CoArrive);
        this.CoArrive = this.StartCoroutine(this.CoCheckArrive(false));
    }
}