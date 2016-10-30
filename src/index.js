import DR from './ramda.js'

const R = DR.R

function isJSON(str) {
  try {
    const stringified = JSON.stringify(str)
    if (typeof stringified === 'string')
      if (stringified.length === 0)
        return false
    JSON.parse(stringified)
  }
  catch (e) {
    return false
  }
  return true
}

// localstorage helper
class ls {
  static get(key) {
    if (window.localStorage) {
      const got = window.localStorage.getItem(key)
      if (isJSON(got)) return JSON.parse(got)
      return got
    }
    return null
  }

  static set(key, value) {
    if (typeof value === 'object')
      value = JSON.stringify(value)
    if (window.localStorage)
      return window.localStorage.setItem(key, value)
    return null
  }
}

/**
 * @TODO:
 *
 * configure each test on debug
 * (notify:bool, notifyLen:number, importance:number)
 */
class NotificationSource {
  notifications = {}
  options = {
    staleTime: 10000 // 10s
  }

  // @see getRecent
  clearOld() {
    ls.set('browser.notifications', this.getRecent())
    return this
  }

  // fetch, compare dates, delete old
  // return {}
  getRecent() {
    // if !null, map object, select property values (objects)
    // with Date.now() - property timestamp (difference) > this.staleTime
    return DR.ifValThen(
      R.pickBy(R.where({
        timestamp: R.pipe(
          R.subtract(Date.now(), R.__),
          R.gt(R.__, this.options.staleTime))
      }),
      ls.get('browser.notifications')
    ))
  }

  // @param {string} body
  // @return {bool}
  notifiedRecentlyOf(body) {
    // hahaha wow
    // if (this.getRecent().map(n => {n.body}).includes(body))
    if ( DR.ifThen(DR.isObject, R.where({body: R.contains(body)}), this.getRecent()) )
      return true
    return false
  }

  makeSerializable(notification) {
    return {
      badge: notification.badge,
      body: notification.body,
      data: notification.data,
      dir: notification.dir,
      icon: notification.icon,
      renotify: notification.renotify,
      requireInteraction: notification.requireInteraction,
      silent: notification.silent,
      tag: notification.tag,
      timestamp: notification.timestamp,
      title: notification.title,
      _serialized: true,
    }
  }

  // : Notification
  //
  // @chainable
  add(notification) {
    const serialized = (!notification._serialized) ?
      this.makeSerializable(notification) :
      notification

    this.notifications = DR.qq(ls.get('browser.notifications'), {})
    this.notifications[notification.timestamp] = serialized
    ls.set('browser.notifications', this.notifications)

    return this
  }
}

const ns = new NotificationSource()

function notify(msg, options = {timeout: 5000, title: 'Testing (dect):', staleTime: 10000}) {
  if (!Notification)
    throw new Error('use a better browser that supports notifications!')
  if (Notification.permission !== 'granted')
    Notification.requestPermission()

  if (ns.notifiedRecentlyOf(msg)) return

  const message = {
    body: msg,
    icon: 'https://cdn3.iconfinder.com/data/icons/line/36/beaker-512.png',
    tag: msg,
  }
  const notification = new Notification(options.title, message)

  if (options.timeout) {
    const closed = setTimeout(notification.close.bind(notification), options.timeout)
  }

  ns.clearOld()
  ns.add(notification)

  notification.onclick = function() {
    window.location.href = window.location.href + '?testing...'
  }
}

export default notify
