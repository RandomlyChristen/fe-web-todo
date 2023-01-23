import Component from "../../core/Component.js";
import TodoDatabase from "../../persistance/TodoDatabase.js";
import TodoCard from "../TodoCard/TodoCard.js";
import DoubleClickInput from "../DoubleClickInput/DoubleClickInput.js";
import TodoAddForm from "../TodoAddForm/TodoAddForm.js";
import NotificationManager from "../../core/NotificationManager.js";

class TodoHolder extends Component {
    initialize() {
        this.addEvent('click', '.add-todo-btn', this.toogleAddForm.bind(this));
    }

    template() {
        return `
        <div class="todoholder-header">
            <div class="todoholder-colinfo">
                <div data-component="DoubleClickInput"></div>
                <div class="count-circle">
                    <h4 class="todoholder-counter"></h4>
                </div>
            </div>
            <div class="todoholder-headerbtn-wrapper">
                <button class="add-todo-btn"><svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M0.105709 7.53033L0.105709 6.46967H6.46967V0.105713H7.53033V6.46967H13.8943V7.53033H7.53033V13.8943H6.46967V7.53033H0.105709Z"/></svg></button>
                <button class="delete-column-btn"><svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 11.25L0.75 10.5L5.25 6L0.75 1.5L1.5 0.750004L6 5.25L10.5 0.750004L11.25 1.5L6.75 6L11.25 10.5L10.5 11.25L6 6.75L1.5 11.25Z"/></svg></button>        
            </div>
        </div>
        <div data-component="TodoAddForm" hidden></div>
        <article class="todoholder-actual"></article>
        `;
    }

    mounted() {
        this.mountTodoCounter();
        this.mountColumnNameInput();
        this.mountAddForm();
        this.mountTodoCards();
    }

    async mountTodoCounter() {
        const { id } = this.props.column;
        const column = (await TodoDatabase.getColumns({ id }))[0];
        const $counter = this.$target.querySelector('.todoholder-counter');
        $counter.innerText = column.todoIds.length;
    }

    mountColumnNameInput() {
        const { name } = this.props.column;
        const $doubleClickInput = this.$target.querySelector('[data-component="DoubleClickInput"]');
        new DoubleClickInput($doubleClickInput, {
            value: name,
            placeholder: '칼럼 이름을 입력하세요',
            onValueChanged: this.updateColumnName.bind(this)
        });
    }

    async mountTodoCards() {
        const { column } = this.props;
        const todoIds = (await TodoDatabase.getColumns({ id: column.id }))[0].todoIds;
        const todos = todoIds.length ? await TodoDatabase.getTodos(todoIds) : [];
        const $actualHolder = this.$target.querySelector('.todoholder-actual');
        $actualHolder.innerHTML = `${todoIds.map(todoId => `
            <div data-component="TodoCard" data-todo-id="${todoId}" data-column-id="${column.id}"></div>`).join('')}
            <div data-component="TodoCard" data-todo-id="-1" data-column-id="${column.id}"></div>`;

        const $todoCards = this.$target.querySelectorAll(`[data-component="TodoCard"]`);
        $todoCards.forEach($todoCard => {
            const todoId = parseInt($todoCard.dataset.todoId);
            const todo = todos.find(todo => todo.id === todoId) || { id: -1, columnId: column.id };
            new TodoCard($todoCard, { todo, $actualHolder, onTodoMoved: this.updateMovedTodo.bind(this) });
        });
    }

    mountAddForm() {
        const $todoAddForm = this.$target.querySelector('[data-component="TodoAddForm"]');
        new TodoAddForm($todoAddForm, {
            addTodo: this.addTodo.bind(this),
            addCancel: this.toogleAddForm.bind(this)
        });
    }

    toogleAddForm() {
        const $addForm = this.$target.querySelector('[data-component="TodoAddForm"]');
        const checked = !$addForm.toggleAttribute('hidden');
        const $button = this.$target.querySelector('.add-todo-btn');
        $button.style.fill = checked ? '#0075DE' : '#010101';
    }

    async addTodo(name, description) {
        let { column } = this.props;
        const newTodo = await TodoDatabase.postTodo({ name, description });
        const newTodoIds = (await TodoDatabase.getColumns({ id: column.id }))[0].todoIds;
        newTodoIds.unshift(newTodo.id);
        column = await TodoDatabase.patchColumn({ id: column.id, todoIds: newTodoIds });

        const $actualHolder = this.$target.querySelector('.todoholder-actual');
        $actualHolder.insertAdjacentHTML('afterbegin',
            `<div data-component="TodoCard" data-todo-id="${newTodo.id}" data-column-id="${column.id}"></div>`);
        new TodoCard($actualHolder.firstElementChild, { todo: newTodo, $actualHolder, onTodoMoved: this.updateMovedTodo.bind(this) });

        this.toogleAddForm();

        this.notifyAddTodo(newTodo, column.name);
    }

    notifyAddTodo(todo, columnName) {
        return NotificationManager.makeNotification({
            type: NotificationManager.notificationTypes.ADD,
            name: todo.name,
            to: columnName
        });
    }

    updateColumnName(newName) {
        const { column } = this.props;
        TodoDatabase.patchColumn({ id: column.id, name: newName });
    }

    updateMovedTodo() {
        this.mountTodoCards();
        this.mountTodoCounter();
    }
}

export default TodoHolder;