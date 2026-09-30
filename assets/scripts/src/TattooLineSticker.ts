import { _decorator, CCFloat, Component, Node, Tween, tween, UITransform, Vec3 } from 'cc';
import { PatchSticker } from './PatchSticker';
import { ConcreteAggregate } from './Iterator/ConcreteAggregate';
import { Iterator } from './Iterator/Iterator';
import { PatchLineSticker } from './PatchLineSticker';
import { PatchSticker2 } from './PatchSticker2';
import { Constant } from '../../constant/constant';
const { ccclass, property } = _decorator;

/**
 * Một lượt vẽ: tất cả patch khai báo ở đây được vẽ cùng lúc sau một lần chạm.
 * Patch đầu tiên là phần dẫn đầu - máy xăm chạy theo nó; các phần còn lại tự
 * chạy anim draw fill song song.
 */
@ccclass('DrawGroup')
export class DrawGroup {
    @property({ tooltip: 'Ghi chú cho dễ nhìn trong inspector' })
    note: string = '';

    @property({ type: [Node], tooltip: 'Các node patch vẽ cùng lượt. Node đầu tiên là phần dẫn đầu.' })
    patchNodes: Node[] = [];

    @property({
        tooltip: 'Bật: vẽ xong lượt này thì máy xăm tự nhấc bút sang vẽ tiếp lượt kế tiếp, không cần tap.',
    })
    autoStart: boolean = false;

    @property({
        type: CCFloat,
        tooltip: 'Nghỉ thêm bao nhiêu giây sau khi nhấc bút xong mới vẽ lượt kế tiếp.',
        visible: function (this: DrawGroup) { return this.autoStart; },
    })
    autoStartDelay: number = 0;
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
        type: Node,
        tooltip: 'Node base shown briefly before gameplay starts. Assign it inside the fixed tattoo prefab.',
    })
    basePreview: Node = null;

    @property({
        type: [DrawGroup],
        tooltip: 'Cấu hình từng lượt vẽ. Để trống = mỗi patch một lượt như trước.',
    })
    drawGroups: DrawGroup[] = [];

    @property({
        type: CCFloat,
        tooltip: 'Thời gian anim nhấc bút chuyển sang phần kế tiếp, tính bằng giây.',
    })
    penLiftDuration: number = 0.45;

    /** Các lượt vẽ đã phân giải từ drawGroups. */
    groups: PatchSticker[][] = [];
    /** Config của từng lượt trong groups, cùng độ dài với groups. */
    groupConfigs: DrawGroup[] = [];
    groupIndex: number = -1;
    currentGroup: PatchSticker[] = [];

    private pendingDrawCount: number = 0;
    private groupDrawStarted: boolean = false;
    private completedPatches: Set<PatchSticker> = new Set<PatchSticker>();
    /** Vị trí máy xăm khi kết thúc lượt trước - điểm bắt đầu của anim nhấc bút. */
    private lastMachinePos: Vec3 = new Vec3();
    /** Lượt trước dùng máy đi line hay máy tô màu. */
    private lastMachineIsLine: boolean = true;

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
        this.groupConfigs = [];
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
                this.groupConfigs.push(group);
            }
        });

        this.patchs.forEach((patch) => {
            if (!assigned.has(patch)) {
                this.groups.push([patch]);
                this.groupConfigs.push(null);
            }
        });
    }

    /**
     * Lượt `groupIndex` có tự chạy mà không cần chạm hay không - do lượt ngay
     * trước nó bật autoStart ("vẽ xong tôi thì sang lượt sau luôn").
     */
    private isAutoStartGroup(groupIndex: number): boolean {
        if (groupIndex <= 0) return false;
        const prevConfig = this.groupConfigs[groupIndex - 1];
        return !!prevConfig && prevConfig.autoStart;
    }

    /** Quãng nghỉ trước khi lượt `groupIndex` tự vẽ, khai ở lượt trước nó. */
    private getAutoStartDelay(groupIndex: number): number {
        const prevConfig = this.groupConfigs[groupIndex - 1];
        return prevConfig ? Math.max(0, prevConfig.autoStartDelay) : 0;
    }

    isWaitingForManualDrawInput(): boolean {
        const leader = this.currentGroup[0];
        if (!leader || this.groupDrawStarted || this.isAutoStartGroup(this.groupIndex)) {
            return false;
        }

        if (
            leader instanceof PatchSticker
            && !(leader instanceof PatchLineSticker)
            && window.tattoContext.shouldSkipColorPatchPhase()
        ) {
            return false;
        }

        return true;
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
            // showFinalImageOnly() có thể đã tắt node này; bật lại để nét đứt
            // hướng dẫn của patch hiện lên được.
            patch.node.active = true;
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

    /**
     * Tất cả patch của lượt đã hiện xong. Lượt thường thì mở input chờ người
     * chơi chạm; lượt autoStart thì nhấc bút chuyển sang rồi tự vẽ.
     */
    private onGroupPatchesShown() {
        const leader = this.currentGroup[0];
        if (!leader) return;

        if (this.isAutoStartGroup(this.groupIndex)) {
            // Nét đứt của cả lượt phải hiện sẵn trong lúc bút đang chuyển sang,
            // để người chơi thấy trước sắp vẽ ở đâu.
            this.currentGroup.forEach((patch) => patch.showGuide());
            this.playPenLift(leader, () => {
                const delay = this.getAutoStartDelay(this.groupIndex);
                if (delay > 0) {
                    this.scheduleOnce(() => this.startGroupWithoutTouch(), delay);
                } else {
                    this.startGroupWithoutTouch();
                }
            });
            window.tattoContext.onShowNextPatchDone(this.groupIndex);
            return;
        }

        if (leader instanceof PatchLineSticker) {
            leader.sprayDotComp.registerTouchEvent();
            window.tattoContext.tattoLineMachineOpacity.opacity = 255;
            window.tattoContext.setTattooLineMachinePos(
                leader.sprayDotComp.paths[0],
                leader.sprayDotComp.node,
            );
        } else {
            leader.sprayComp.registerTouchEvent();
            window.tattoContext.tattoMachineOpacity.opacity = 255;
        }

        window.tattoContext.onShowNextPatchDone(this.groupIndex);
    }

    /**
     * Anim nhấc bút: đưa máy xăm từ chỗ vừa vẽ xong sang điểm bắt đầu của lượt
     * kế tiếp. Nếu hai lượt dùng hai loại máy khác nhau thì mờ máy cũ đi rồi
     * hiện máy mới lên.
     */
    private playPenLift(nextLeader: PatchSticker, onLiftDone: () => void) {
        const ctx = window.tattoContext;
        const nextIsLine = nextLeader instanceof PatchLineSticker;
        const duration = Math.max(0, this.penLiftDuration);

        const machine = nextIsLine ? ctx.tattoLineMachine : ctx.tattoMachine;
        const machineOpacity = nextIsLine ? ctx.tattoLineMachineOpacity : ctx.tattoMachineOpacity;
        if (!machine || !machineOpacity) {
            console.error('TattooLineSticker: thieu tham chieu may xam de chay anim nhac but.');
            onLiftDone();
            return;
        }

        Tween.stopAllByTarget(machine);
        Tween.stopAllByTarget(machineOpacity);

        // Đổi loại máy thì máy cũ phải rút đi trước.
        if (this.lastMachineIsLine !== nextIsLine) {
            const prevOpacity = this.lastMachineIsLine ? ctx.tattoLineMachineOpacity : ctx.tattoMachineOpacity;
            if (prevOpacity) {
                Tween.stopAllByTarget(prevOpacity);
                tween(prevOpacity).to(duration * 0.5, { opacity: 0 }).start();
            }
        }

        const target = this.getMachineStartPos(nextLeader, machine);

        // Đổi loại máy thì máy mới hiện ngay tại đích, không trượt ngang màn.
        const slideFromLastPos = this.lastMachineIsLine === nextIsLine;
        machine.setPosition(slideFromLastPos ? this.lastMachinePos : target);

        if (duration === 0 || !slideFromLastPos) {
            machine.setPosition(target);
            if (duration === 0) {
                machineOpacity.opacity = 255;
                onLiftDone();
                return;
            }
            // Không có chỗ cũ để trượt: chỉ hiện bút lên rồi vẽ.
            machineOpacity.opacity = 0;
            tween(machineOpacity)
                .to(duration, { opacity: 255 })
                .call(() => onLiftDone())
                .start();
            return;
        }

        // Bút hạ xuống mặt da: mờ nhẹ khi rời chỗ cũ rồi đậm lại ở điểm mới.
        tween(machineOpacity)
            .to(duration * 0.35, { opacity: 140 })
            .to(duration * 0.65, { opacity: 255 })
            .start();

        tween(machine)
            .to(duration, { position: new Vec3(target.x, target.y, target.z) }, { easing: 'sineInOut' })
            .call(() => onLiftDone())
            .start();
    }

    /**
     * Điểm autoDraw() của phần tô màu bắt đầu quét: góc trên-trái vùng mask,
     * quy về hệ toạ độ của máy xăm.
     */
    private getMachineStartPos(patch: PatchSticker, machine: Node): Vec3 {
        const ctx = window.tattoContext;

        if (patch instanceof PatchLineSticker) {
            const stroke = patch.sprayDotComp;
            const firstPoint = stroke.paths[0] ?? Vec3.ZERO;
            return ctx.convertPositionToTargetParent(firstPoint, stroke.node, machine);
        }

        const maskNode = patch.sprayComp?.maskNode;
        const mask = maskNode?.getComponent(UITransform);
        if (!maskNode || !mask) {
            return ctx.convertPositionToTargetParent(Vec3.ZERO, patch.node, machine);
        }

        const maskTopLeft = new Vec3(-mask.width / 2, mask.height / 2, 0);
        return ctx.convertPositionToTargetParent(maskTopLeft, maskNode, machine);
    }

    /** Chạy lượt vẽ mà không cần người chơi chạm. */
    private startGroupWithoutTouch() {
        const leader = this.currentGroup[0];
        if (!leader || this.groupDrawStarted) return;

        const ctx = window.tattoContext;
        // Các bước này vốn nằm trong onTouchStart của component vẽ; lượt tự chạy
        // không đi qua đó nên phải làm ở đây.
        ctx.handTutorial.active = false;
        ctx.textTutorial.active = false;
        //@ts-ignore
        if (ctx.labelInk) {
            //@ts-ignore
            ctx.stopTextInkEffect();
        }

        ctx.audioManager.stopAll();
        ctx.audioManager.playMusic(Constant.EFFECT_NAME.TATTOO_MACHINE_LINE, true);

        leader.setCanSpray(true);
        leader.drawComp.startAutoDraw();
        this.onLeaderDrawStarted();
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
            // Lượt kế tiếp tự chạy thì giữ máy xăm tại chỗ để nhấc bút từ đây.
            // Hết lượt thì luôn thu máy về, dù lượt cuối có bật autoStart.
            const keepMachine = !!this.groups[this.groupIndex + 1]
                && this.isAutoStartGroup(this.groupIndex + 1);
            const isLine = patch instanceof PatchLineSticker;
            this.lastMachineIsLine = isLine;

            if (isLine) {
                this.lastMachinePos.set(window.tattoContext.tattoLineMachine.position);
                if (!keepMachine) {
                    window.tattoContext.tattoLineMachineOpacity.opacity = 0;
                    window.tattoContext.tattoLineMachine.setPosition(Vec3.ZERO);
                }
                (patch as PatchLineSticker).sprayDotComp.unRegisterTouchEvent();
            } else {
                this.lastMachinePos.set(window.tattoContext.tattoMachine.position);
                if (!keepMachine) {
                    window.tattoContext.tattoMachineOpacity.opacity = 0;
                    window.tattoContext.tattoMachine.setPosition(Vec3.ZERO);
                }
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

        const nextAutoStart = this.isAutoStartGroup(this.groupIndex + 1);

        this.hideCurrentPatch(() => {
            const groupHasLine = currentGroup.some((patch) => patch instanceof PatchLineSticker);
            const nextGroupIsColor = nextGroup[0] instanceof PatchSticker2;

            if (groupHasLine && nextGroupIsColor) {
                this.showFinalImageOnly();
                window.tattoContext.showTextWow();
                // Lượt tự chạy thì vào luôn, không chèn quãng nghỉ khen thưởng.
                if (nextAutoStart) {
                    this.showNextPatch();
                } else {
                    setTimeout(() => {
                        this.showNextPatch();
                    }, 2000);
                }
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
