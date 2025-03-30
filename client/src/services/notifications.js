import * as tates from "tates";
import { createStateHook } from "react-tates";

/**
 * @typedef {Object} Notification
 * @property {string | string[] | ArrayLike<string> } text
 * @property {string} label?
 * @property {'warning' | 'danger' | 'success' | 'info'} severity?
 *
 * @typedef {Object} NotificationState
 * @property {Notification | null} notification
 * @property {number} loadTime
 * @property {boolean} timerRunning
 */

const tate = /** @type {tates.State<NotificationState>} */ tates.createState();
const { state } = tate;

export const actions = {
  /**
   * @param { Notification | null } Notification
   */
  notify(notification = null) {
    state.notification = notification;
  },

  loadTime(time) {
    state.loadTime = time;
  },

  startTimer() {
    state.loadTime = 0;
    state.timerRunning = true;
  },

  stopTimer() {
    state.timerRunning = false;
  },

  /**
   * @param {unknown} e
   */
  handleError(e) {
    console.error(e);
    let errorMessage = "Unknown error ocurred";
    if (utils.isErrorLike(e)) {
      errorMessage = e.message;
    }

    actions.notify({
      text: errorMessage,
      severity: "danger",
    });
  },
};

/**
 * Lets you know when there is a new global notification
 */
export const hooks = {
  useNotification: createStateHook({
    tate,
    property: "notifcation",
    initialValue: /** @type {Notification | null} */ (null),
  }),

  useLoadTime: createStateHook({
    tate,
    property: "loadTime",
    initialValue: 0,
  }),

  useTimerRunning: createStateHook({
    tate,
    property: "timerRunning",
    initialValue: 0,
  }),
};
