const DragManager = {
    draggableComponentName: undefined,
    draggingStyle: '',
    $dragstartComponent: undefined,
    $draggingComponent: undefined,
    dragstartInnerPos: {
        x: undefined,
        y: undefined
    },
    $lastCollapsedComponent: undefined,

    setDraggableDatasetComponentName(componentName) {
        this.draggableComponentName = componentName;
    },

    __mousedownEventListener(ev) {
        this.$lastCollapsedComponent = null;
        const $target = findClosestComponent(ev.target, this.draggableComponentName);
        if (!$target || $target.classList.contains(this.BLOCK_DRAG_CLASS))
            return;
        this.$dragstartComponent = $target;
        this.dragstartInnerPos = {
            x: ev.clientX - $target.offsetLeft,
            y: ev.clientY - $target.offsetTop
        };
    },

    __mousemoveEventListener(ev) {
        if (!this.$dragstartComponent)
            return;
        const { movementX, movementY } = ev;
        if (!this.$draggingComponent &&
            vectorNorm({ x: movementX, y: movementY }) > MOVEMENT_THRESHOLD) {
            this.$draggingComponent = document.createElement('dragging');
            this.$draggingComponent.innerHTML = this.$dragstartComponent.outerHTML;
            this.$draggingComponent.style.position = 'absolute';
            this.$draggingComponent.style.zIndex = '999';
            this.$draggingComponent.style.pointerEvents = 'none';
            this.$draggingComponent.style.left = '0';
            this.$draggingComponent.style.top = '0';
            document.body.appendChild(this.$draggingComponent);
            this.$dragstartComponent.classList.add('dragstart');
        }
        if (this.$draggingComponent) {
            const translateX = ev.clientX - this.dragstartInnerPos.x;
            const translateY = ev.clientY - this.dragstartInnerPos.y;
            this.$draggingComponent.style.transform = `translate(${translateX}px, ${translateY}px)`;

            const $collapsedComponentTarget = findClosestComponent(ev.target, this.draggableComponentName);
            if ($collapsedComponentTarget) {
                if ($collapsedComponentTarget === this.$dragstartComponent)
                    return;
                this.$lastCollapsedComponent = $collapsedComponentTarget;
                $collapsedComponentTarget.dispatchEvent(new MyDragEvent(
                    DragManager.dragEventTypes.COLLAPSED,
                    this.$dragstartComponent,
                    $collapsedComponentTarget
                ));
            }
        }
    },

    __mouseupEventListener() {
        const dragEvent = new MyDragEvent(
            DragManager.dragEventTypes.END,
            this.$dragstartComponent,
            this.$lastCollapsedComponent
        );
        if (this.$dragstartComponent && this.$draggingComponent && this.$lastCollapsedComponent) {
            this.$lastCollapsedComponent.dispatchEvent(dragEvent);
            this.$dragstartComponent.dispatchEvent(dragEvent);
        }
        this.$dragstartComponent?.classList.remove('dragstart');
        fadeOut(this.$draggingComponent, this.$dragstartComponent);
        this.$dragstartComponent = null;
        this.$draggingComponent = null;
        this.$lastCollapsedComponent = null;

        function fadeOut($src, $des) {
            if (!$src) return;
            $src.style.transition = '0.2s';
            $src.style.transform = `translate(${$des.offsetLeft}px, ${$des.offsetTop}px)`;
            setTimeout(() => {
                $src.remove();
            }, 200);
        }
    },

    initialize() {
        document.addEventListener('mousedown', DragManager.__mousedownEventListener.bind(this));
        document.addEventListener('mousemove', DragManager.__mousemoveEventListener.bind(this));
        document.addEventListener('mouseup', DragManager.__mouseupEventListener.bind(this));
    },

    BLOCK_DRAG_CLASS: 'block-drag',
    dragEventTypes: {
        COLLAPSED: 'mydragcollapsed',
        END: 'mydragend'
    }
};

class MyDragEvent extends CustomEvent {
    constructor(type, $start, $lastCollapsed) {
        super(type, { bubbles: true });
        this.dragStartedElement = $start;
        this.lastCollapsedElement = $lastCollapsed;
    }
}

const MOVEMENT_THRESHOLD = 5;

function vectorNorm({x, y}) {
    return Math.sqrt(x * x + y * y);
}

function findClosestComponent($child, componentName) {
    return $child.closest(`[data-component="${componentName}"]`);
}

export default DragManager;