import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from './(tabs)/chats/CustomeDrawer';
import { StatusBar } from 'react-native';
import { useTheme } from '@react-navigation/native';

function StatusBarComponent() {
  const { colors, dark } = useTheme();
  return (
    <StatusBar
      backgroundColor={colors.background}
      barStyle={dark ? 'light-content' : 'dark-content'}
      translucent={true}
    />
  );
}

export default function AppLayout() {
  return (
    <>
      <StatusBarComponent />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: 'Home', // This label is for the drawer, but it's handled by CustomDrawerContent
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: 'Profile', // This label is for the drawer, but it's handled by CustomDrawerContent
          }}
        />
        <Drawer.Screen
          name="edit-profile"
          options={{
            drawerLabel: 'Edit Profile', // This label is for the drawer, but it's handled by CustomDrawerContent
          }}
        />
        <Drawer.Screen
          name="manage-account"
          options={{
            drawerItemStyle: { display: 'none' }, // Hide from the drawer
            headerShown: false, // Since manage-account.tsx has a custom header
          }}
        />
      </Drawer>
    </>
  );
}