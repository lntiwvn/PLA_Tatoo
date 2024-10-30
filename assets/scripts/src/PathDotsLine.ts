import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PathDotsLine')
export class PathDotsLine extends Component {
    @property([Node])
    pathsLine: Node[] = [];
}


