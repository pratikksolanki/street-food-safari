import { usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export const unstable_settings = {
    initialRouteName: '(1-vendors)',
};

export default function TabsLayout() {
    // Hide the native tab bar on full-screen interior routes. The search
    // screen owns its own chrome (input, Cancel button) and was rendering
    // the tab bar above the keyboard, which reads as broken.
    const pathname = usePathname();
    const hideTabBar = pathname === '/search';

    return (
        <NativeTabs hidden={hideTabBar}>
            <NativeTabs.Trigger name="(1-vendors)">
                <NativeTabs.Trigger.Label>Vendors</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon sf= {{default: "storefront", selected: "storefront.fill"}} md="storefront" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="(2-favorites)">
                <NativeTabs.Trigger.Label>Favorites</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon sf= {{default: "heart", selected: "heart.fill"}} md="favorite" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="(3-about)">
                <NativeTabs.Trigger.Label>About</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon sf= {{default: "info.circle", selected: "info.circle.fill"}} md="info" />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
