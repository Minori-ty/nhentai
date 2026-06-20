import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'
import Search from './views/Search.vue'
import Detail from './views/Detail.vue'
import Favorites from './views/Favorites.vue'
import Single from './views/Single.vue'
import TagPage from './views/TagPage.vue'

const router = createRouter({
    history: createWebHashHistory(),
    scrollBehavior() {
        return { top: 0 }
    },
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home,
        },
        {
            path: '/search',
            name: 'Search',
            component: Search,
        },
        {
            path: '/detail/:id',
            name: 'Detail',
            component: Detail,
        },
        {
            path: '/single/:id',
            name: 'Single',
            component: Single,
        },
        {
            path: '/favorites',
            name: 'Favorites',
            component: Favorites,
        },
        {
            path: '/tag/:tag',
            name: 'Tag',
            component: TagPage,
            props: { tagType: 'tag' },
        },
        {
            path: '/group/:group',
            name: 'Group',
            component: TagPage,
            props: { tagType: 'group' },
        },
        {
            path: '/artist/:artist',
            name: 'Artist',
            component: TagPage,
            props: { tagType: 'artist' },
        },
        {
            path: '/character/:character',
            name: 'Character',
            component: TagPage,
            props: { tagType: 'character' },
        },
        {
            path: '/language/:language',
            name: 'Language',
            component: TagPage,
            props: { tagType: 'language' },
        },
        {
            path: '/category/:category',
            name: 'Category',
            component: TagPage,
            props: { tagType: 'category' },
        },
    ],
})

export default router
