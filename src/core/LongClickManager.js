const LongClickManager = {
    mouseDownTimeMilli: 0,
    $longClickTarget: null,
    isMouseDown: false,
    longClickStartThreshold: 0,
    longCLickEndThreshold: 0,

    setLongClickStartThreshold(timeMilli) {
        this.longClickStartThreshold = timeMilli;
    },
    setLongClickEndThreshold(timeMilli) {
        this.longCLickEndThreshold = timeMilli;
    },

    __mousedownEventListener({ target }) {
        this.mouseDownTimeMilli = Date.now();
        this.$longClickTarget = target;
        this.isMouseDown = true;
        this.__startLongClick();
    },

    __mousemoveEventListener({ target }) {
        if (target !== this.$longClickTarget) {
            this.isMouseDown = false;
        }
    },

    __mouseupEventListener() {
        this.isMouseDown = false;
    },

    __startLongClick() {
        requestAnimationFrame(() => {
            if (!this.isMouseDown) return;
            const currTimeMilli = Date.now();
            if (currTimeMilli > (this.mouseDownTimeMilli + this.longClickStartThreshold)) {
                this.$longClickTarget.dispatchEvent(new LongClickEvent(
                    LongClickManager.longClickEventTypes.START
                ));
                this.__afterStart();
                return;
            }
            this.__startLongClick();
        })
    },

    __afterStart() {
        requestAnimationFrame(() => {
            if (!this.isMouseDown) {
                this.$longClickTarget.dispatchEvent(new LongClickEvent(
                    LongClickManager.longClickEventTypes.CANCELED
                ));
                return;
            }
            const currTimeMilli = Date.now();
            if (currTimeMilli > (this.mouseDownTimeMilli + this.longCLickEndThreshold)) {
                this.$longClickTarget.dispatchEvent(new LongClickEvent(
                    LongClickManager.longClickEventTypes.END
                ));
                return;
            }
            this.__afterStart();
        })
    },

    initialize() {
        document.addEventListener('mousedown', this.__mousedownEventListener.bind(this));
        document.addEventListener('mousemove', this.__mousemoveEventListener.bind(this));
        document.addEventListener('mouseup', this.__mouseupEventListener.bind(this));
    },

    longClickEventTypes: {
        START: 'mylongclickstart',
        CANCELED: 'mylongclickcancled',
        END: 'mylongclickend'
    }
}

class LongClickEvent extends CustomEvent {
    constructor(type) {
        super(type, { bubbles: true });
    }
}

export default LongClickManager;