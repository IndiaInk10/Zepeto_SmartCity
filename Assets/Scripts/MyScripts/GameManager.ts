import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';

import { Transform } from 'UnityEngine'

export default class GameManager extends ZepetoScriptBehaviour {
    public static PLAYER: string = "Player";
    public static localPlayerTr: Transform = null;
    public static isSit: boolean = false;
}