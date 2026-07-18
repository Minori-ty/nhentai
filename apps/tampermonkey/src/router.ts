import { createRouter, createWebHashHistory } from 'vue-router'

import Detail from './views/Detail.vue'
import Favorites from './views/Favorites.vue'
import Home from './views/Home.vue'
import Search from './views/Search.vue'
import Single from './views/Single.vue'
import TagPage from './views/TagPage.vue'

const router = createRouter({
    history: createWebHashHistory(),
    scrollBehavior(to, _from, savedPosition) {
        // 组件自己管理滚动，router 不干涉
        if (to.meta.scrollSelf) {
            return false
        }
        // 需要保留滚动的页面，后退时恢复位置
        if (to.meta.scrollKeep && savedPosition) {
            return savedPosition
        }
        // 其余页面切换自动置顶
        return { top: 0 }
    },
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home,
            meta: { scrollKeep: true }, // 标记本页保留滚动位置
        },
        {
            path: '/search',
            name: 'Search',
            component: Search,
            meta: { scrollKeep: true }, // 标记本页保留滚动位置
        },
        {
            path: '/detail/:id',
            name: 'Detail',
            component: Detail,
            meta: { scrollSelf: true },
        },
        {
            path: '/single/:id',
            name: 'Single',
            component: Single,
            meta: { scrollSelf: true },
        },
        {
            path: '/favorites',
            name: 'Favorites',
            component: Favorites,
        },
        {
            path: '/tag/:name',
            name: 'Tag',
            component: TagPage,
            props: { tagType: 'tag' },
        },
        {
            path: '/group/:name',
            name: 'Group',
            component: TagPage,
            props: { tagType: 'group' },
        },
        {
            path: '/artist/:name',
            name: 'Artist',
            component: TagPage,
            props: { tagType: 'artist' },
        },
        {
            path: '/character/:name',
            name: 'Character',
            component: TagPage,
            props: { tagType: 'character' },
        },
        {
            path: '/language/:name',
            name: 'Language',
            component: TagPage,
            props: { tagType: 'language' },
        },
        {
            path: '/category/:name',
            name: 'Category',
            component: TagPage,
            props: { tagType: 'category' },
        },
    ],
})

export default router
