import type { RouteRecordInfo } from 'vue-router'

declare module 'vue-router' {
    interface TypesConfig {
        RouteNamedMap: {
            Home: RouteRecordInfo<'Home', '/', Record<never, never>, Record<never, never>>
            Search: RouteRecordInfo<'Search', '/search', Record<never, never>, Record<never, never>>
            Detail: RouteRecordInfo<'Detail', '/detail/:id', { id: string | number }, { id: string }>
            Single: RouteRecordInfo<'Single', '/single/:id', { id: string | number }, { id: string }>
            Favorites: RouteRecordInfo<'Favorites', '/favorites', Record<never, never>, Record<never, never>>
            Tag: RouteRecordInfo<'Tag', '/tag/:name', { name: string }, { name: string }>
            Group: RouteRecordInfo<'Group', '/group/:name', { name: string }, { name: string }>
            Artist: RouteRecordInfo<'Artist', '/artist/:name', { name: string }, { name: string }>
            Character: RouteRecordInfo<'Character', '/character/:name', { name: string }, { name: string }>
            Language: RouteRecordInfo<'Language', '/language/:name', { name: string }, { name: string }>
            Category: RouteRecordInfo<'Category', '/category/:name', { name: string }, { name: string }>
        }
    }
}
