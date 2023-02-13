import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 解决报错
const originalPush = VueRouter.prototype.push
const originalReplace = VueRouter.prototype.replace
// push
VueRouter.prototype.push = function push(location, onResolve, onReject) {
    if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject)
    return originalPush.call(this, location).catch(err => err)
}
// replace
VueRouter.prototype.replace = function push(location, onResolve, onReject) {
    if (onResolve || onReject) return originalReplace.call(this, location, onResolve, onReject)
    return originalReplace.call(this, location).catch(err => err)
}

const routes = [
    {
        path: '/',
        name: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/layout/login')
    },
    {
        path: '/flowDisplay',
        name: 'flowDisplay',
        component: () => import('@/views/flow/flow-display'),
        meta: {
            title: '流程查看'
        }
    },
    {
        name: 'home',
        path: '/home',
        component: () => import('@/views/layout/home'),
        children: [
            {
                name: 'readme',
                path: '/readme',
                component: () => import('@/views/layout/readme'),
                meta: {
                    title: '首页'
                }
            },
            {
                name: 'runCode',
                path: '/runCode',
                component: () => import('@/views/layout/run-code'),
                meta: {
                    keepAlive: true
                }
            },
            {
                name: 'contact',
                path: '/contact',
                component: () => import('@/views/system/contact'),
                meta: {
                    title: '通讯录'
                }
            },
            {
                name: 'role',
                path: '/role',
                component: () => import('@/views/system/role'),
                meta: {
                    title: '角色管理'
                }
            },
            {
                name: 'publicNotice',
                path: '/publicNotice',
                component: () => import('@/views/system/public-notice'),
                meta: {
                    keepAlive: true,
                    title: '发布公告'
                }
            },
            {
                name: 'showNotice',
                path: '/showNotice',
                component: () => import('@/views/system/show-notice'),
                meta: {
                    keepAlive: true,
                    title: '消息详情'
                }
            },
            {
                name: 'message',
                path: '/message',
                component: () => import('@/views/system/message'),
                meta: {
                    title: '消息中心'
                }
            },
            {
                name: 'addCustomForm',
                path: '/addCustomForm',
                component: () => import('@/views/form/add-custom-form'),
                meta: {
                    keepAlive: true
                }
            },
            {
                name: 'editCustomForm',
                path: '/editCustomForm',
                component: () => import('@/views/form/edit-custom-form'),
                meta: {}
            },
            {
                name: 'handleCustomForm',
                path: '/handleCustomForm',
                component: () => import('@/views/form/handle-custom-form'),
                meta: {
                    keepAlive: true
                }
            },
            {
                name: 'formList',
                path: '/formList',
                component: () => import('@/views/form/form-list'),
                meta: {
                    keepAlive: true
                }
            },
            {
                name: 'reportList',
                path: '/reportList',
                component: () => import('@/views/form/report-list'),
                meta: {
                    keepAlive: true
                }
            },
            {
                name: 'analysis',
                path: '/analysis',
                component: () => import('@/views/form/analysis'),
                meta: {
                    keepAlive: true
                }
            },
            {
                name: 'todoItem',
                path: '/todoItem',
                component: () => import('@/views/work/todo-item'),
                meta: {
                    keepAlive: true,
                    title: '待办事项'
                }
            },
            {
                name: 'readyItem',
                path: '/readyItem',
                component: () => import('@/views/work/ready-item'),
                meta: {
                    keepAlive: true,
                    title: '待发事项'
                }
            },
            {
                name: 'doneItem',
                path: '/doneItem',
                component: () => import('@/views/work/done-item'),
                meta: {
                    keepAlive: true,
                    title: '已办事项'
                }
            },
            {
                name: 'copyItem',
                path: '/copyItem',
                component: () => import('@/views/work/copy-item'),
                meta: {
                    keepAlive: true,
                    title: '抄送事项'
                }
            },
            {
                name: 'selfItem',
                path: '/selfItem',
                component: () => import('@/views/work/self-item'),
                meta: {
                    keepAlive: true,
                    title: '我发起的'
                }
            },
            {
                name: 'test',
                path: '/test',
                component: () => import('@/views/layout/test'),
                meta: {
                    keepAlive: true,
                    title: '测试页面'
                }
            }
        ]
    }
]

const router = new VueRouter({
    mode: 'history',
    routes
})

import store from '@/store/index'

router.beforeEach((to, from, next) => {
    if (window.platform) {
        document.title = window.platform.title
    } else {
        document.title = localStorage.getItem('title')
    }
    var authorization = localStorage.getItem('Authorization')
    if (authorization) {
        if (!store.state.isAddRouter) {
            store.commit('handleAddRouter', true)
            // 动态路由
            let dyRoutes = JSON.parse(localStorage.getItem('routes'))
            if (dyRoutes) {
                for (let i = 0; i < dyRoutes.length; i++) {
                    let dyRoute = dyRoutes[i]
                    if (dyRoute.type === 9) {
                        router.addRoute({
                            name: dyRoute.path,
                            path: encodeURI('/' + dyRoute.path),
                            component: resolve => require([`@/views/${dyRoute.path}`], resolve),
                            meta: {
                                title: dyRoute.name
                            }
                        })
                    } else {
                        let pathStr = dyRoute.path
                        let queryStr = pathStr.split('?')[1]
                        let keyObj = {}
                        if (queryStr != '' && queryStr != undefined && queryStr != null) {
                            let list = queryStr.split('&')
                            list.forEach(element => {
                                let queryObj = element.split('=')
                                keyObj[queryObj[0]] = queryObj[1]
                            })
                            dyRoute.path = pathStr.split('?')[0]
                            dyRoute.query = keyObj
                        }
                        router.addRoute('home', {
                            name: dyRoute.path,
                            path: encodeURI('/' + dyRoute.path),
                            component: resolve => require([`@/views/${dyRoute.path}`], resolve),
                            query: dyRoute.query,
                            meta: {
                                title: dyRoute.name
                            }
                        })
                    }
                }
                next({ ...to, replace: true })
            } else {
                next()
            }
        } else {
            next()
        }
    } else {
        if (to.path === '/' || to.path === '/login' || to.path === '/wps') {
            next()
        } else {
            next('/login')
        }
    }
})

Vue.prototype.$history = router
export default router
