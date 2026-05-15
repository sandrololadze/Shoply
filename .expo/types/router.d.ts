/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(app)` | `/(app)/groups` | `/(app)/profile` | `/(auth)` | `/(auth)/login` | `/(auth)/signup` | `/_sitemap` | `/groups` | `/login` | `/profile` | `/signup`;
      DynamicRoutes: `/(app)/group/${Router.SingleRoutePart<T>}` | `/(app)/group/${Router.SingleRoutePart<T>}/activity` | `/(app)/group/${Router.SingleRoutePart<T>}/members` | `/group/${Router.SingleRoutePart<T>}` | `/group/${Router.SingleRoutePart<T>}/activity` | `/group/${Router.SingleRoutePart<T>}/members`;
      DynamicRouteTemplate: `/(app)/group/[id]` | `/(app)/group/[id]/activity` | `/(app)/group/[id]/members` | `/group/[id]` | `/group/[id]/activity` | `/group/[id]/members`;
    }
  }
}
