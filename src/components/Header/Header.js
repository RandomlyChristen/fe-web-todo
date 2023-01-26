import Component from "../../core/Component.js";
import NotificationCard from "../NotificationCard/NotificationCard.js";
import TodoDatabase from "../../core/TodoDatabase.js";
import NotificationManager from "../../core/NotificationManager.js";
import ToastManager from "../../core/ToastManager.js";

class Header extends Component {
    initialize() {
        this.state = { notifications: [] };
        TodoDatabase.getNotifications().then(notifications => {
            this.setState({ notifications: notifications.reverse() });
        });
        this.addEvent('click', '#sidebar_open_btn', this.openSidebar.bind(this));
        this.addEvent('click', '#sidebar_close_btn, #sidebar_bgbtn', this.closeSidebar.bind(this));
        this.addEvent('click', '#sidebar_trash_btn', this.clearNotifications.bind(this));
        this.addEvent(NotificationManager.notificationEventType, '*', this.addNotification.bind(this));
    }

    addNotification({ notification }) {
        TodoDatabase.postNotification(notification).then(notification => {
            this.setState({ notifications: [notification, ...this.state.notifications] })
        });
    }

    openSidebar() {
        const $sidebar = this.$target.querySelector('#sidebar_wrapper');
        $sidebar.classList.add('sidebar-opened');
    }

    closeSidebar() {
        const $sidebar = this.$target.querySelector('#sidebar_wrapper');
        $sidebar.classList.remove('sidebar-opened');
    }

    template() {
        return `
        <h1>TO-DO LIST</h1>
        <button id="sidebar_open_btn">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 1V0H17V1H0ZM17 5V6H0V5H17ZM0 10H17V11H0V10Z" fill="#010101"/>
            </svg>
        </button>
        <div id="sidebar_wrapper">
            <button id="sidebar_bgbtn"></button>
            <div id="sidebar">
                <header>
                    <button class="close-button-black" id="sidebar_close_btn"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 11.25L0.75 10.5L5.25 6L0.75 1.5L1.5 0.750004L6 5.25L10.5 0.750004L11.25 1.5L6.75 6L11.25 10.5L10.5 11.25L6 6.75L1.5 11.25Z" fill="#010101"/></svg></button>            
                </header>
                <ul class="notification-holder">
                ${this.state.notifications.map(({ id }) =>
                    `<li data-component="NotificationCard" data-notification-id="${id}"></li>`
                ).join('')}       
                </ul>
                <button class="close-button-black" id="sidebar_trash_btn"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="Editable-line" width="20" height="20" viewBox="0 0 32 32" xml:space="preserve"><path d="  M25,10H7v17c0,1.105,0.895,2,2,2h14c1.105,0,2-0.895,2-2V10z" fill="none" id="XMLID_194_" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2"/><path d="  M20,7h-8V5c0-1.105,0.895-2,2-2h4c1.105,0,2,0.895,2,2V7z" fill="none" id="XMLID_193_" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2"/><path d="  M28,10H4V8c0-0.552,0.448-1,1-1h22c0.552,0,1,0.448,1,1V10z" fill="none" id="XMLID_192_" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2"/><line fill="none" id="XMLID_191_" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2" x1="13" x2="19" y1="16" y2="22"/><line fill="none" id="XMLID_190_" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2" x1="13" x2="19" y1="22" y2="16"/></svg></button>
            </div>
        </div>
        `;
    }

    mounted() {
        const $notificationCards = this.$target.querySelectorAll('[data-component="NotificationCard"]');
        const { notifications } = this.state;
        $notificationCards.forEach($notificationCard => {
            const notificationId = parseInt($notificationCard.dataset.notificationId);
            const notification = notifications.find(notification => notification.id === notificationId);
            new NotificationCard($notificationCard, { notification });
        });
    }

    clearNotifications() {
        const $trash = this.$target.querySelector('#sidebar_trash_btn');
        $trash.disabled = true;

        const $ul = this.$target.querySelector('.notification-holder');
        const afterAnimationTimeMill = Array.from($ul.children).reduce((timeMilli, $notification) => {
            setTimeout(() => {
                $notification.classList.add('slide-out');
            }, timeMilli);
            return timeMilli + 100;
        }, 0);

        setTimeout(() => {
            this.deleteAllNotification().catch(console.error);
        }, afterAnimationTimeMill + 500);
    }

    async deleteAllNotification() {
        this.closeSidebar();
        const { notifications } = this.state;
        for (const { id } of notifications) {
            await TodoDatabase.deleteNotification({ id });
        }
        ToastManager.show('알림이 초기화 되었습니다.', 1000);
        setTimeout(() => {
            this.setState({ notifications: [] });
        }, 1000);
    }
}

export default Header;