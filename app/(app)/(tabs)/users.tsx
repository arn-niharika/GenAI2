import * as React from 'react';

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../components/ThemeProvider';
import { useUser } from '@clerk/clerk-expo';
import { useUserStore } from '../../../state';
import ConfirmModal from '../../../components/ConfirmModal';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/clerk-expo';

type ActionType = 'changeRole' | 'changeStatus' | 'changePremium';

const UsersScreen = () => {
  const { colors } = useTheme();
  const { user } = useUser();
  const {
    users,
    loading,
    error,
    currentPage,
    rowsPerPage,
    searchTerm,
    fetchUsers,
    setCurrentPage,
    setRowsPerPage,
    setSearchTerm,
    changeUserRole,
    changeUserStatus,
  } = useUserStore();

  const { getToken } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);

  // Fetch users when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const token = await getToken();
        if (token) {
          fetchUsers(token);
        }
      }
      fetchData();
    }, [])
  );

  // Handle search with debounce
  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);
    setDebounceTimer(timer);
  };

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const paginatedUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Handle modal actions
  const handleOpenModal = (user: any, action: ActionType) => {
    setSelectedUser(user);
    setActionType(action);
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    if (!selectedUser || !actionType || !user?.id) return;
    const token = await getToken();
    if (!token) return ;

    if (actionType === 'changeRole') {
      const newRole = selectedUser.role === 'admin' ? 'user' : 'admin';
      await changeUserRole(token, selectedUser, newRole);
    } else if (actionType === 'changeStatus') {
      await changeUserStatus(token, selectedUser);
    } else if (actionType === 'changePremium') {
      const newRole = selectedUser.role === 'premium' ? 'user' : 'premium';
      await changeUserRole(token, selectedUser, newRole);
    }
  };

  // Get modal content based on action type
  const getModalContent = () => {
    if (!selectedUser || !actionType) return { title: '', message: '' };

    if (actionType === 'changeRole') {
      return {
        title: 'Confirm Role Change',
        message: `Are you sure you want to make ${selectedUser.name} ${selectedUser.role === 'admin' ? 'a user' : 'an admin'
          }?`,
      };
    } else if (actionType === 'changeStatus') {
      return {
        title: 'Confirm Status Change',
        message: `Are you sure you want to ${selectedUser.status === 'enabled' ? 'disable' : 'enable'
          } ${selectedUser.name}?`,
      };
    } else {
      return {
        title: 'Confirm Premium Status Change',
        message: `Are you sure you want to make ${selectedUser.name} ${selectedUser.role === 'premium' ? 'a regular user' : 'a premium user'
          }?`,
      };
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 p-4" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <Text className="text-[18px] font-[400px] leading-[30px] pb-2" style={{ color: colors.text }}>
          User Roles
        </Text>

        {/* Search Bar */}
        <View className="mb-[20px]">
          <View
            className="flex-row items-center justify-center rounded-lg px-3 h-[40px]"
            style={{
              backgroundColor: colors.searchbg,
              alignItems: 'center', // Ensure vertical centering
            }}
          >
            <Ionicons name="search" size={18} color="#7E7E7E" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Search"
              placeholderTextColor="#7E7E7E"
              value={searchTerm}
              onChangeText={handleSearch}
              style={{
                color: colors.text,
                height: 40,
                textAlignVertical: 'center', // Center text vertically
                paddingVertical: 0, // Remove default padding
              }}
            />
          </View>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-red-500">{error}</Text>
          </View>
        ) : (
          <>
            {/* Table Header */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View className="mb-2">
                <View className="flex-row rounded-t-lg h-[42px]" style={{ backgroundColor: colors.tableBorder }}>
                  <Text
                    className="text-sm font-normal px-2 w-16"
                    style={{
                      color: colors.text,
                      textAlignVertical: 'center', // Center text vertically
                      lineHeight: 42, // Match the container height
                    }}
                  >
                    Sr No
                  </Text>
                  <Text
                    className="text-sm font-normal px-2 w-[146px]"
                    style={{
                      color: colors.text,
                      textAlignVertical: 'center',
                      lineHeight: 42,
                    }}
                  >
                    Name
                  </Text>
                  <Text
                    className="text-sm font-normal px-2 w-[174px]"
                    style={{
                      color: colors.text,
                      textAlignVertical: 'center',
                      lineHeight: 42,
                    }}
                  >
                    Email
                  </Text>
                  <Text
                    className="text-sm font-normal px-2 w-[146px]"
                    style={{
                      color: colors.text,
                      textAlignVertical: 'center',
                      lineHeight: 42,
                    }}
                  >
                    Role
                  </Text>
                  <Text
                    className="text-sm font-normal px-2 w-[146px]"
                    style={{
                      color: colors.text,
                      textAlignVertical: 'center',
                      lineHeight: 42,
                    }}
                  >
                    Status
                  </Text>
                  <Text
                    className="text-sm font-normal px-2 w-[146]"
                    style={{
                      color: colors.text,
                      textAlignVertical: 'center',
                      lineHeight: 42,
                    }}
                  >
                    Change Role
                  </Text>
                  <Text
                    className="text-sm font-normal px-2 w-[189px]"
                    style={{
                      color: colors.text,
                      textAlignVertical: 'center',
                      lineHeight: 42,
                    }}
                  >
                    Change Premium Status
                  </Text>
                  <Text
                    className="text-sm font-normal px-2 w-[189px]"
                    style={{
                      color: colors.text,
                      textAlignVertical: 'center',
                      lineHeight: 42,
                    }}
                  >
                    Change Status
                  </Text>
                </View>

                {/* Table Rows */}
                {paginatedUsers.map((item, index) => (
                  <View
                    key={item.id}
                    className="flex-row  font-normal items-center py-2"
                    style={{
                      backgroundColor: colors.background,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.tableBorder,
                    }}
                  >
                    <Text
                      className="text-sm  font-normal px-2 w-16 capitalize"
                      style={{ color: colors.text }}
                    >
                      {indexOfFirstUser + index + 1}
                    </Text>
                    <Text
                      className="text-sm   font-normal  px-2 w-[146px] text-left capitalize"
                      style={{ color: colors.text }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      className="text-sm   font-normal px-2 w-[174px] text-left"
                      style={{ color: colors.text }}
                    >
                      {item.email}
                    </Text>
                    <Text
                      className="text-sm  font-normal  px-2 w-[146px] text-left"
                      style={{ color: colors.text }}
                    >
                      {item.role.toUpperCase()}
                    </Text>
                    <Text
                      className="text-sm   font-normal px-2 w-[146px] text-left"
                      style={{
                        color:
                          colors.text,
                      }}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                    {/* <TouchableOpacity
                      className="px-2   font-normal w-[146px] text-left"
                      onPress={() => handleOpenModal(item, 'changeRole')}
                    >
                       <LinearGradient
          colors={['#2F9A92', '#2C72FF']}
          locations={[0, 1]}
          start={{ x: 0.54, y: 0.41 }}
          end={{ x: 0.49, y: 1.5 }}
          style={{
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            height: 47,
            width: '80%',
            flexDirection: 'row',
          }}
        >
                      <Text
                        className="text-sm   font-normal  text-center rounded-lg py-1"
                        style={{
                          backgroundColor: colors.primary + '20',
                          color: colors.primary,
                        }}
                      >
                        {item.role === 'admin' ? 'Make User' : 'Make Admin'}
                      </Text>
                      </LinearGradient>
                    </TouchableOpacity> */}

                    <TouchableOpacity
                      className="px-2   font-normal w-[146px] text-left"
                      onPress={() => handleOpenModal(item, 'changeRole')}
                    >
                      <Text
                        className="text-sm   font-normal  text-center rounded-lg py-2"
                        style={{
                          backgroundColor: colors.primary + '20',
                          color: colors.primary,
                          opacity: item.role === 'admin' ? 0.5 : 1,
                        }}
                      >
                        {item.role === 'admin' ? 'Make User' : 'Make Admin'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="px-2    font-normal w-[189px] text-left"
                      onPress={() => handleOpenModal(item, 'changePremium')}
                      disabled={item.role === 'admin'}
                    >
                      <Text
                        className="text-sm   font-normal  text-center rounded-lg py-2"
                        style={{
                          backgroundColor: colors.primary + '20',
                          color: colors.primary,
                          opacity: item.role === 'admin' ? 0.5 : 1,
                        }}
                      >
                        {item.role === 'premium'
                          ? 'Remove Premium'
                          : 'Upgrade to Premium'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="px-2 w-[189px]   font-normal  text-left"
                      onPress={() => handleOpenModal(item, 'changeStatus')}
                    >
                      <Text
                        className="text-sm text-center   font-normal  rounded-lg py-2"
                        style={{
                          backgroundColor: '#F25D7120',
                          color: '#F25D71',
                        }}
                      >
                        {item.status === 'enabled'
                          ? 'Deactivate User'
                          : 'Enable User'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Pagination */}
            {users.length > 0 && (
              <View className="pt-2 pb-4 border-t" style={{ borderColor: colors.border }}>
                {/* Rows per page */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Text
                      className="text-sm opacity-50 mr-2"
                      style={{ color: colors.text }}
                    >
                      Rows per page
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <TouchableOpacity
                        className="rounded px-1.5 py-1 flex-row items-center justify-between w-[50px]"
                        style={{ backgroundColor: colors.searchbg }}
                        onPress={() => setShowRowsDropdown((prev) => !prev)}
                      >
                        <Text
                          className="text-xs opacity-50"
                          style={{ color: colors.text }}
                        >
                          {rowsPerPage}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color={colors.text}
                          style={{ opacity: 0.5 }}
                        />
                      </TouchableOpacity>
                      {showRowsDropdown && (
                        <View
                          className="absolute bottom-0 left-0 rounded-lg p-2 z-10 w-[100px]"
                          style={{
                            backgroundColor: colors.card,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                            elevation: 5,
                          }}
                        >
                          {[5, 10, 15, 20].map((num) => (
                            <TouchableOpacity
                              key={num}
                              className="py-2 px-3"
                              style={{
                                borderBottomWidth: num !== 20 ? 1 : 0,
                                borderBottomColor: colors.border,
                              }}
                              onPress={() => {
                                setRowsPerPage(num);
                                setCurrentPage(1);
                                setShowRowsDropdown(false);
                              }}
                            >
                              <Text
                                className="text-sm"
                                style={{
                                  color: colors.text,
                                  fontWeight: rowsPerPage === num ? 'bold' : 'normal',
                                }}
                              >
                                {num}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  <Text className="text-sm" style={{ color: colors.text }}>
                    Page {currentPage} of {totalPages}
                  </Text>
                </View>

                {/* Prev/Next buttons with LinearGradient */}
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="flex-1 mr-2 rounded-md overflow-hidden"
                    onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{ height: 47 }}
                  >
                    {currentPage === 1 ? (
                      <LinearGradient
                        colors={['#2F9A92', '#2C72FF']}
                        locations={[0, 1]}
                        start={{ x: 0.54, y: 0.41 }}
                        end={{ x: 0.49, y: 1.5 }}
                        style={{
                          paddingVertical: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          height: 47,
                          width: '100%',
                          flexDirection: 'row',
                          opacity: 0.3, // 30% opacity for disabled state
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: '500' }}>
                          Previous
                        </Text>
                      </LinearGradient>
                    ) : (
                      <LinearGradient
                        colors={['#2F9A92', '#2C72FF']}
                        locations={[0, 1]}
                        start={{ x: 0.54, y: 0.41 }}
                        end={{ x: 0.49, y: 1.5 }}
                        style={{
                          paddingVertical: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          height: 47,
                          width: '100%',
                          flexDirection: 'row',
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: '500' }}>
                          Previous
                        </Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 ml-2 rounded-md overflow-hidden"
                    onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{ height: 47 }}
                  >
                    {currentPage === totalPages ? (
                      <LinearGradient
                        colors={['#2F9A92', '#2C72FF']}
                        locations={[0, 1]}
                        start={{ x: 0.54, y: 0.41 }}
                        end={{ x: 0.49, y: 1.5 }}
                        style={{
                          paddingVertical: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          height: 47,
                          width: '100%',
                          flexDirection: 'row',
                          opacity: 0.3, // 30% opacity for disabled state
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: '500' }}>
                          Next
                        </Text>
                      </LinearGradient>
                    ) : (
                      <LinearGradient
                        colors={['#2F9A92', '#2C72FF']}
                        locations={[0, 1]}
                        start={{ x: 0.54, y: 0.41 }}
                        end={{ x: 0.49, y: 1.5 }}
                        style={{
                          paddingVertical: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          height: 47,
                          width: '100%',
                          flexDirection: 'row',
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: '500' }}>
                          Next
                        </Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Page numbers */}
                <View className="flex-row justify-center mt-3 flex-wrap gap-[16px]">
                  {getPageNumbers().map((page, index) => (
                    <TouchableOpacity
                      key={index}
                      className="mx-1 my-1 items-center justify-center"
                      style={{
                        width: 46,
                        height: 28,
                        borderRadius: 4,
                        backgroundColor: page === currentPage
                          ? 'transparent'
                          : colors.searchbg,
                      }}
                      onPress={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={typeof page !== 'number'}
                    >
                      <Text
                        className="text-sm"
                        style={{
                          color: colors.text,
                        }}
                      >
                        {page}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Confirmation Modal */}
      <ConfirmModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirm}
        title={getModalContent().title}
        message={getModalContent().message}
      />
    </View>
  );
};

export default UsersScreen;
