const getUser = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('user');
}
const BASE_URL = 'http://localhost:3000';
const TODO_URI = BASE_URL + '/todos';
const COLUMN_URI = BASE_URL + '/columns';
const NOTIFICATION_URI = BASE_URL + '/notifications'

/**
 * @typedef {{id: number|undefined, name: string|undefined, author: string|undefined, description: string|undefined}} TodoEntity
 * @typedef {{id: number|undefined, name: string|undefined, todoIds: number[]|undefined}} ColumnEntity
 */

/**
 * @param {ColumnEntity} column
 * @returns {Promise<ColumnEntity[]>}
 */
const getColumns = async (column={}) => {
    const getColumnRes = await fetch(COLUMN_URI + getQueryString(column),
        { cache: "no-store" });
    const columns = await getColumnRes.json();
    columns.forEach((col, idx) => {
        columns[idx] = {...col, todoIds: JSON.parse(col.todoIds)};
    });
    return columns;
}

/**
 * @param {ColumnEntity} column
 * @returns {Promise<ColumnEntity>}
 */
const postColumn = async (column) => {
    const newColumnRes = await fetch(COLUMN_URI, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ name: column.name, todoIds: "[]" })
    });
    const newColumn = await newColumnRes.json();
    return {...newColumn, todoIds: JSON.parse(newColumn.todoIds)};
}

/**
 * @param {ColumnEntity} column
 * @returns {Promise<ColumnEntity>}
 */
const patchColumn = async (column) => {
    const patchColumnRes = await fetch(`${COLUMN_URI}/${column.id}`, {
        method: 'PATCH',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ ...column, todoIds: JSON.stringify(column.todoIds)})
    });
    const newColumn = await patchColumnRes.json();
    return {...newColumn, todoIds: JSON.parse(newColumn.todoIds)};
}

/**
 * @param {*} query
 * @returns {Promise<TodoEntity[]>}
 */
const getTodos = async (query) => {
    const getTodosRes = await fetch(TODO_URI + getQueryString(query), {
        cache: "no-store"
    });
    return await getTodosRes.json();
}

/**
 * @param {TodoEntity} todo
 * @returns {Promise<TodoEntity|false>}
 */
const postTodo = async (todo) => {
    const newTodoRes = await fetch(TODO_URI, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ ...todo, author: getUser() })
    });
    return await newTodoRes.json();
};

/**
 * @param {TodoEntity} todo
 * @returns {Promise<any>}
 */
const deleteTodo = async (todo) => {
    const deleteTodoRes = await fetch(`${TODO_URI}/${todo.id}`, {
        method: 'DELETE'
    });
    return await deleteTodoRes.json();
}

/**
 * @param {TodoEntity} todo
 * @returns {Promise<TodoEntity>}
 */
const patchTodo = async (todo) => {
    const patchTodoRes = await fetch(`${TODO_URI}/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(todo)
    });
    return await patchTodoRes.json();
}

/**
 * @param {NotificationEntity} notification
 * @returns {Promise<NotificationEntity[]>}
 */
const getNotifications = async (notification={}) => {
    const getNotificationsRes = await fetch(NOTIFICATION_URI + getQueryString(notification),
        { cache: "no-store" });
    return await getNotificationsRes.json();
};

/**
 * @param {NotificationEntity} notification
 * @returns {Promise<NotificationEntity>}
 */
const postNotification = async (notification) => {
    const newNotificationRes = await fetch(NOTIFICATION_URI, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ ...notification, author: getUser() })
    });
    return await newNotificationRes.json();
};

const patchCollection = async (collection) => {
    if (collection.columns?.length) {
        collection.columns?.forEach(column => {
            column.todoIds = JSON.stringify(column.todoIds);
        });
    }
    const patchCollectionRes = await fetch(`${BASE_URL}/collection`, {
        method: 'PATCH',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(collection)
    });
    return await patchCollectionRes.json();
};

/**
 * @param {TodoEntity|ColumnEntity|number[]|undefined} data
 * @returns {string}
 */
const getQueryString = (data) => {
    if (!data) return '';
    if (Array.isArray(data))
        return `?${data.map(id => `id=${id}`).join('&')}`;
    if (data.id)
        return `?id=${data.id}`;
    return '?' + (data.author ? `&author=${data.author}` : '');
}

let nPendingWorker = 0;

const pendingWrapper = (asyncFunc) => {
    return (...args) => new Promise((resolve, reject) => {
        if (!nPendingWorker) {
            document.body.classList.add('pending');
        }
        ++nPendingWorker;
        asyncFunc(...args)
        .then(resolve)
        .catch(reject)
        .finally(() => {
            --nPendingWorker;
            if (!nPendingWorker) {
                document.body.classList.remove('pending');
            }
        });
    });
};

const TodoDatabase = {
    getColumns: pendingWrapper(getColumns),
    postColumn: pendingWrapper(postColumn),
    patchColumn: pendingWrapper(patchColumn),
    getTodos: pendingWrapper(getTodos),
    postTodo: pendingWrapper(postTodo),
    deleteTodo: pendingWrapper(deleteTodo),
    patchTodo: pendingWrapper(patchTodo),
    getNotifications: pendingWrapper(getNotifications),
    postNotification: pendingWrapper(postNotification),
    patchCollection: pendingWrapper(patchCollection)
}

export default TodoDatabase;