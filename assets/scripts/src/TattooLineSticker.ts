import { _decorator, CCString, Component, Node, Vec3 } from 'cc';
import { PatchSticker } from './PatchSticker';
import { ConcreteAggregate } from './Iterator/ConcreteAggregate';
import { Iterator } from './Iterator/Iterator';
import { PatchLineSticker } from './PatchLineSticker';
import { PatchSticker2 } from './PatchSticker2';
const { ccclass, property } = _decorator;

/**
 * Một lượt vẽ: tất cả patch khai báo ở đây được vẽ cùng lúc sau một lần chạm.
 * Patch đầu tiên là phần dẫn đầu - máy xăm chạy theo nó; các phần còn lại tự
 * chạy anim draw fill song song.
 */
@ccclass('DrawGroup')
export class DrawGroup {
    @property({ type: CCString, tooltip: 'Ghi chú cho dễ nhìn trong inspector' })
    note: string = '';

    @property({ type: [Node], tooltip: 'Các node patch vẽ cùng lượt. Node đầu tiên là phần dẫn đầu.' })
    patchNodes: Node[] = [];
}

@ccclass('TattooLineSticker')
export class TattooLineSticker extends Component {

    patchs: PatchSticker[] = [];

    stickerAggregate: ConcreteAggregate<PatchSticker>;
    stickerIterator: Iterator<PatchSticker>;
    currentPatchSticker: PatchSticker;

    @property(Node)
    finalImage: Node = null;

    @property({
        type: [DrawGroup],
        tooltip: 'Cấu hình từng lượt vẽ. Để trống = mỗi patch một lượt như trước.',
    })
    drawGroups: DrawGroup[] = [];

    /** Các lượt vẽ đã phân giải từ drawGroups. */
    groups: PatchSticker[][] = [];
    groupIndex: number = -1;
    currentGroup: PatchSticker[] = [];

    private pendingDrawCount: number = 0;
    private groupDrawStarted: boolean = false;
    private completedPatches: Set<PatchSticker> = new Set<PatchSticker>();

    init() {
        this.patchs = [];
        this.patchs = this.node.children.map((node) => {
            let pathLine = node.getComponent(PatchLineSticker);
            let pathSticker2 = node.getComponent(PatchSticker2);

            if (pathLine) {
                return pathLine;
            }

            if (pathSticker2) {
                return pathSticker2;
            }

            const patchSticker = node.getComponent(PatchSticker);
            if (patchSticker) {
                return patchSticker;
            }
            return null;
        }).filter((sticker): sticker is PatchSticker => sticker !== null);

        if (this.finalImage) {
            this.finalImage.active = false;
        }


        this.patchs.forEach((sticker) => {
            sticker.init();
            sticker.hideMachinePatch();
        });

        this.buildGroups();

        this.stickerAggregate = new ConcreteAggregate<PatchSticker>();
        this.stickerAggregate.addItem(this.patchs);
        this.stickerIterator = this.stickerAggregate.createIterator();
    }

    /**
     * Dựng danh sách lượt vẽ từ drawGroups. Patch nào không nằm trong nhóm nào
     * sẽ tự thành một lượt riêng ở cuối, giữ nguyên thứ tự con của node.
     */
    private buildGroups() {
        this.groups = [];
        this.groupIndex = -1;
        this.currentGroup = [];

        const assigned = new Set<PatchSticker>();

        this.drawGroups.forEach((group, index) => {
            const members: PatchSticker[] = [];
            group.patchNodes.forEach((node) => {
                if (!node) return;
                const patch = this.patchs.find((item) => item.node === node);
                if (!patch) {
                    console.error('TattooLineSticker: drawGroups[' + index + '] tham chieu node "' + node.name + '" khong phai patch cua sticker nay.');
                    return;
                }
                if (assigned.has(patch)) {
                    console.error('TattooLineSticker: patch "' + node.name + '" duoc khai bao o nhieu luot ve; bo qua lan khai bao sau.');
                    return;
                }
                assigned.add(patch);
                members.push(patch);
            });
            if (members.length > 0) {
                this.groups.push(members);
            }
        });

        this.patchs.forEach((patch) => {
            if (!assigned.has(patch)) {
                this.groups.push([patch]);
            }
        });
    }

    /** Chuyển sang lượt vẽ kế tiếp. Giữ tên cũ vì context đang gọi hàm này. */
    showNextPatch() {
        this.groupIndex++;
        const group = this.groups[this.groupIndex];

        if (!group) {
            this.currentGroup = [];
            this.currentPatchSticker = null;
            window.tattoContext.onCurrentStickerDone();
            return;
        }

        this.currentGroup = group;
        const leader = group[0];
        this.currentPatchSticker = leader;
        this.syncIteratorPosition();

        if (leader instanceof PatchSticker && !(leader instanceof PatchLineSticker)) {
            if (window.tattoContext.shouldSkipColorPatchPhase()) {
                window.tattoContext.onCurrentStickerDone();
                return;
            }
            //@ts-ignore
            if (window.tattoContext.labelInk && window.tattoContext.isFirstShowTextInk) {
                //@ts-ignore
                window.tattoContext.enableTextColorEffect();
            }
        }

        this.pendingDrawCount = group.length;
        this.groupDrawStarted = false;
        this.completedPatches.clear();

        // Hiện phần dẫn đầu sau cùng để nó nằm trên và giữ màu VFX của mình.
        const showOrder = group.slice(1).concat(leader);
        let shownCount = 0;
        const reported = new Set<PatchSticker>();

        showOrder.forEach((patch) => {
            patch.node.setSiblingIndex(this.patchs.length);

            const drawComp = patch.drawComp;
            drawComp.isLeader = patch === leader;
            drawComp.onDrawComplete = () => this.onPatchDrawComplete(patch);
            drawComp.onDrawStarted = drawComp.isLeader ? () => this.onLeaderDrawStarted() : null;

            patch.showPatch(() => {
                if (reported.has(patch)) return;
                reported.add(patch);
                shownCount++;
                if (shownCount === showOrder.length) {
                    this.onGroupPatchesShown();
                }
            });
        });
    }

    /**
     * Giữ stickerIterator trỏ đúng patch dẫn đầu của lượt hiện tại để các đoạn
     * code cũ đọc getCurrentPosition() vẫn nhận được số thứ tự patch hợp lệ.
     */
    private syncIteratorPosition() {
        const leaderIndex = this.patchs.indexOf(this.currentGroup[0]);
        if (leaderIndex >= 0) {
            this.stickerIterator.goto(leaderIndex);
            this.stickerIterator.next();
        }
    }

    /** Tất cả patch của lượt đã hiện xong - mở input cho phần dẫn đầu. */
    private onGroupPatchesShown() {
        const leader = this.currentGroup[0];
        if (!leader) return;

        if (leader instanceof PatchLineSticker) {
            leader.sprayDotComp.registerTouchEvent();
            window.tattoContext.tattoLineMachineOpacity.opacity = 255;
            window.tattoContext.tattoLineMachine.setPosition(leader.sprayDotComp.paths[0]);
        } else {
            leader.sprayComp.registerTouchEvent();
            window.tattoContext.tattoMachineOpacity.opacity = 255;
        }

        window.tattoContext.onShowNextPatchDone(this.groupIndex);
    }

    /** Người chơi chạm để vẽ phần dẫn đầu - các phần còn lại chạy kèm ngay. */
    private onLeaderDrawStarted() {
        if (this.groupDrawStarted) return;
        this.groupDrawStarted = true;

        for (let i = 1; i < this.currentGroup.length; i++) {
            const follower = this.currentGroup[i];
            // Bật cờ vẽ phòng khi tween hiện patch vừa kết thúc ở frame này.
            follower.setCanSpray(true);
            follower.drawComp.startAutoDraw();
        }
    }

    private onPatchDrawComplete(patch: PatchSticker) {
        // Một patch có thể báo xong từ nhiều đường (chạm kết thúc, mask đã đầy),
        // chỉ tính một lần để không kết thúc lượt sớm.
        if (this.completedPatches.has(patch) || this.currentGroup.indexOf(patch) < 0) {
            return;
        }
        this.completedPatches.add(patch);

        if (patch === this.currentGroup[0]) {
            if (patch instanceof PatchLineSticker) {
                window.tattoContext.tattoLineMachineOpacity.opacity = 0;
                window.tattoContext.tattoLineMachine.setPosition(Vec3.ZERO);
                patch.sprayDotComp.unRegisterTouchEvent();
            } else {
                window.tattoContext.tattoMachineOpacity.opacity = 0;
                window.tattoContext.tattoMachine.setPosition(Vec3.ZERO);
                patch.sprayComp.unRegisterTouchEvent();
            }
        }

        this.pendingDrawCount--;
        if (this.pendingDrawCount > 0) return;

        this.onGroupDrawComplete();
    }

    private onGroupDrawComplete() {
        const currentGroup = this.currentGroup;
        const nextGroup = this.groups[this.groupIndex + 1];

        if (!nextGroup) {
            this.hideCurrentPatch(() => { });
            this.showFinalImageOnly();
            window.tattoContext.onCurrentStickerDone();
            return;
        }

        this.hideCurrentPatch(() => {
            const groupHasLine = currentGroup.some((patch) => patch instanceof PatchLineSticker);
            const nextGroupIsColor = nextGroup[0] instanceof PatchSticker2;

            if (groupHasLine && nextGroupIsColor) {
                this.showFinalImageOnly();
                window.tattoContext.showTextWow();
                setTimeout(() => {
                    this.showNextPatch();
                }, 2000);
            } else {
                this.showNextPatch();
            }
        });
    }

    hideCurrentPatch(onHideComplete: () => void) {
        const group = this.currentGroup;
        if (!group || group.length === 0) {
            onHideComplete && onHideComplete();
            return;
        }

        const hidden = group.map(() => false);
        group.forEach((patch, index) => {
            patch.hidePatch(() => {
                if (hidden[index]) return;
                hidden[index] = true;
                if (hidden.every((done) => done)) {
                    onHideComplete && onHideComplete();
                }
            });
        });
    }

    private showFinalImageOnly(): void {
        if (!this.finalImage) {
            console.error('TattooLineSticker: finalImage is not assigned.');
            return;
        }
        this.node.children.forEach((child) => {
            child.active = child === this.finalImage;
        });
        this.finalImage.active = true;
        this.finalImage.setSiblingIndex(this.node.children.length - 1);
    }

    onPrayComplete() {
        if (this.currentPatchSticker) {
            this.onPatchDrawComplete(this.currentPatchSticker);
        }
    }

    onPrayNotComplete(posNotFill: Vec3) {
        // console.log('posNotFill ', posNotFill);
        // this.helpNode.setPosition(posNotFill);
    }
}
