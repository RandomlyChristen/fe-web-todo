import Component from "./core/Component.js";
import Header from "./components/Header/Header.js";
import AddColumnButton from "./components/AddColumnButton/AddColumnButton.js";
import TodoHolder from "./components/TodoHolder/TodoHolder.js";
import TodoDatabase from "./core/TodoDatabase.js";
import DragManager from "./core/DragManager.js";
import NotificationManager from "./core/NotificationManager.js";
import LongClickManager from "./core/LongClickManager.js";
import ToastManager from "./core/ToastManager.js";

class App extends Component {
    initialize() {
        this.initializeDragFeature();
        this.initializeNotificationFeature();
        this.initializeLongCLickFeature();
    }

    template() {
        return `
        <div data-component="Header"></div>
        <div data-component="AddColumnButton"></div>
        <div id="article"></div>
        `;
    }

    mounted() {
        this.mountAddColumnButton();
        this.mountHeader();
        this.mountTodoHolders().catch(console.error);
    }

    mountHeader() {
        const $header = this.$target.querySelector('[data-component="Header"]');
        new Header($header);
    }

    async mountTodoHolders() {
        const columns = await TodoDatabase.getColumns();
        const $article = this.$target.querySelector('#article');
        $article.innerHTML = `${columns.map((column) =>
            `<div data-component="TodoHolder" data-column-id="${column.id}"></div>`).join('')}`;

        const $todoHolders = this.$target.querySelectorAll('[data-component="TodoHolder"]');
        $todoHolders.forEach($todoHolder => {
            const columnId = parseInt($todoHolder.dataset.columnId);
            new TodoHolder($todoHolder, { column: columns.find(column => column.id === columnId) });
        });
    }

    mountAddColumnButton() {
        const $addColBtn = this.$target.querySelector('[data-component="AddColumnButton"]');
        new AddColumnButton($addColBtn, { addColumn: this.addColumn.bind(this) });
    }

    addColumn() {
        TodoDatabase.postColumn({ name: 'New Column' }).then(column => {
            const $article = this.$target.querySelector('#article');
            $article.insertAdjacentHTML('beforeend',
                `<div data-component="TodoHolder" data-column-id="${column.id}"></div>`);
            const $todoHolder = $article.querySelector(`[data-column-id="${column.id}"]`);
            new TodoHolder($todoHolder, { column });
            ToastManager.show('새로운 칼럼을 추가했습니다.', 1000);
        });
    }

    initializeDragFeature() {
        DragManager.setDraggableDatasetComponentName('TodoCard');
        DragManager.initialize();
    }

    initializeNotificationFeature() {
        NotificationManager.setNotificationTargetComponentName('Header');
        NotificationManager.initialize();
    }

    initializeLongCLickFeature() {
        LongClickManager.setLongClickStartThreshold(500);
        LongClickManager.setLongClickEndThreshold(1500);
        LongClickManager.initialize();
    }
}

export default App;