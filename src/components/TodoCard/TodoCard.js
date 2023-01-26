import Component from "../../core/Component.js";
import TodoDatabase from "../../persistance/TodoDatabase.js";
import DragManager from "../../core/DragManager.js";
import NotificationManager from "../../core/NotificationManager.js";
import LongClickManager from "../../core/LongClickManager.js";
import ToastManager from "../../core/ToastManager.js";

class TodoCard extends Component {
    initialize() {
        this.state = {
            todo: this.props.todo,
            isEdit: false
        };
        this.setEvent();
        this.setDraggable();
    }

    setEvent() {
        this.addEvent('dblclick', '.todocard-dblclick-area', this.startEdit.bind(this));
        this.addEvent('click', '.todocard-edit-cancel', this.cancelEdit.bind(this));
        this.addEvent('click', '.todocard-edit-ok', this.finishEdit.bind(this));
        this.addEvent('click', '.todocard-bgbtn', this.cancelEdit.bind(this));
        this.addEvent(DragManager.dragEventTypes.COLLAPSED, '*', this.onCollapsed.bind(this));
        this.addEvent(DragManager.dragEventTypes.END, '*', this.onDragEnded.bind(this));
        this.addEvent('mousedown', '.todocard-delete', this.shortclick.bind(this));
        this.addEvent(LongClickManager.longClickEventTypes.START, '.todocard-delete', this.startLongclick.bind(this));
        this.addEvent(LongClickManager.longClickEventTypes.CANCELED, '.todocard-delete', this.cancelLongclick.bind(this));
        this.addEvent(LongClickManager.longClickEventTypes.END, '.todocard-delete', this.endLongclick.bind(this));
    }

    onCollapsed(e) {
        const { $actualHolder } = this.props
        const $dragStart = e.dragStartedElement;
        $actualHolder.insertBefore($dragStart, this.$target);
    }

    async onDragEnded(e) {
        const $dragStart = e.dragStartedElement;
        const $lastCollapsed = e.lastCollapsedElement;

        const srcTodoId = parseInt($dragStart.dataset.todoId);
        const srcColumnId = parseInt($dragStart.dataset.columnId);
        const dstTodoId = parseInt($lastCollapsed.dataset.todoId);
        const dstColumnId = parseInt($lastCollapsed.dataset.columnId);

        const collection = { columns: [] };

        const srcColumn = (await TodoDatabase.getColumns({ id: srcColumnId }))[0];
        const dstColumn = srcColumnId === dstColumnId ? srcColumn :
            (await TodoDatabase.getColumns({ id: dstColumnId }))[0];
        const srcPos = srcColumn.todoIds.findIndex(id => id === srcTodoId);
        if (srcPos >= 0) {
            srcColumn.todoIds.splice(srcPos, 1);
            collection.columns.push({ id: srcColumn.id, todoIds: srcColumn.todoIds });
        }
        if (dstColumn.todoIds.includes(srcTodoId)) {
            return;
        }

        const dstPos = dstColumn.todoIds.findIndex(id => id === dstTodoId);
        if (dstPos >= 0) {
            dstColumn.todoIds.splice(dstPos, 0, srcTodoId);
        } else {
            dstColumn.todoIds.push(srcTodoId);
        }
        if (srcColumn === dstColumn && collection.columns.length) {
            collection.columns[0].todoIds = dstColumn.todoIds;
        } else {
            collection.columns.push({ id: dstColumn.id, todoIds: dstColumn.todoIds });
        }

        await TodoDatabase.patchCollection(collection);
        if (this.$target === $dragStart && srcColumnId !== dstColumnId) {
            this.notifyMoved(srcTodoId, srcColumnId, dstColumnId).catch(console.log);
        }
        this.props.onTodoMoved();
    }

    async notifyMoved(srcTodoId, srcColumnId, dstColumnId) {
        const srcTodo = (await TodoDatabase.getTodos({ id: srcTodoId }))[0];
        const srcColumn = (await TodoDatabase.getColumns({ id: srcColumnId }))[0];
        const dstColumn = (await TodoDatabase.getColumns({ id: dstColumnId }))[0];
        return NotificationManager.makeNotification({
            type: NotificationManager.notificationTypes.MOVE,
            name: srcTodo.name,
            from: srcColumn.name,
            to: dstColumn.name
        });
    }

    notifyUpdate(beforeTodo, afterTodo) {
        return NotificationManager.makeNotification({
            type: NotificationManager.notificationTypes.UPDATE,
            from: beforeTodo.name,
            to: afterTodo.name
        });
    }

    notifyDelete(todoName, columnName) {
        return NotificationManager.makeNotification({
            type: NotificationManager.notificationTypes.DELETE,
            from: columnName,
            name: todoName
        });
    }

    async deleteTodo() {
        const { todo } = this.state;
        const columnId = parseInt(this.$target.dataset.columnId);
        const column = (await TodoDatabase.getColumns({ id: columnId }))[0];
        const pos = column.todoIds.findIndex(id => id === todo.id);
        column.todoIds.splice(pos, 1);
        await TodoDatabase.patchColumn({ id: column.id, todoIds: column.todoIds });
        await TodoDatabase.deleteTodo({ id: todo.id });
        this.notifyDelete(todo.name, column.name);
        this.props.onTodoMoved();
    }

    template() {
        if (this.isDummy())
            return '';
        const { todo, isEdit } = this.state;
        return `
        <button class="todocard-bgbtn"></button>
        <div class="progress-click"></div>
        <div class="todocard-dblclick-area">
            <div class="todocard-header">
                ${isEdit ?
                `<input class="todocard-title" value="${todo.name}">` :
                `<h4 class="todocard-title">${todo.name}</h4>`
                }
                <button class="todocard-delete" ${!isEdit || 'disabled'}><svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 11.25L0.75 10.5L5.25 6L0.75 1.5L1.5 0.750004L6 5.25L10.5 0.750004L11.25 1.5L6.75 6L11.25 10.5L10.5 11.25L6 6.75L1.5 11.25Z"/></svg></button>            
            </div>
            ${isEdit ?
            `<textarea class="todocard-desc">${todo.description}</textarea>` :
            `<pre class="todocard-desc">${todo.description}</pre>`
            }
            <p class="todocard-author">author by ${todo.author}</p>
            <div class="todocard-btn-area">
                <button class="todocard-edit-cancel">취소</button>
                <button class="todocard-edit-ok">수정</button>
            </div>        
        </div>
        `
    }

    mounted() {
        if (this.isDummy())
            return;
        this.renderEdit();
        this.fitHeight();
    }

    startEdit() {
        this.setState({ isEdit: true });
    }
    cancelEdit() {
        this.setState({ isEdit: false });
    }
    finishEdit() {
        const $title = this.$target.querySelector('.todocard-title');
        const $desc = this.$target.querySelector('.todocard-desc');
        TodoDatabase.patchTodo({
            id: this.state.todo.id,
            name: $title.value,
            description: $desc.value
        }).then(todo => {
            const oldTodo = { ...this.state.todo };
            this.setState({ isEdit: false, todo });
            this.notifyUpdate(oldTodo, todo);
        });
    }
    fitHeight() {
        const $textarea = this.$target.querySelector('.todocard-desc');
        $textarea.style.height = `${$textarea.scrollHeight}px`;
    }
    renderEdit() {
        if (this.state.isEdit) {
            this.$target.classList.add('edit', DragManager.BLOCK_DRAG_CLASS);
        } else {
            this.$target.classList.remove('edit', DragManager.BLOCK_DRAG_CLASS);
        }
    }
    isDummy() {
        const { todo } = this.state;
        return todo.id < 0;
    }
    setDraggable() {
        if (this.isDummy())
            this.$target.classList.add(DragManager.BLOCK_DRAG_CLASS);
    }
    
    shortclick() {
        ToastManager.show('삭제하려면 꾹 누르세요', 1000);
    }
    startLongclick() {
        this.$target.querySelector(".progress-click").classList.add("on");
    }
    cancelLongclick() {
        this.$target.querySelector(".progress-click").classList.remove("on");
    }
    endLongclick() {
        this.$target.querySelector(".progress-click").classList.remove("on");
        this.deleteTodo();
        ToastManager.show('삭제되었습니다', 1000);
    }
}

export default TodoCard;