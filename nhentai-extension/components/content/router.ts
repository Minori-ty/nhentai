import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'
import Search from './views/Search.vue'
import Detail from './views/Detail.vue'
import Favorites from './views/Favorites.vue'
import Single from './views/Single.vue'
import Tag from './views/Tag.vue'
import Group from './views/Group.vue'
import Artist from './views/Artist.vue'
import Character from './views/Character.vue'
import Language from './views/Language.vue'
import Category from './views/Category.vue'

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
            component: Tag,
        },
        {
            path: '/group/:group',
            name: 'Group',
            component: Group,
        },
        {
            path: '/artist/:artist',
            name: 'Artist',
            component: Artist,
        },
        {
            path: '/character/:character',
            name: 'Character',
            component: Character,
        },
        {
            path: '/language/:language',
            name: 'Language',
            component: Language,
        },
        {
            path: '/category/:category',
            name: 'Category',
            component: Category,
        },
    ],
})

export default router
