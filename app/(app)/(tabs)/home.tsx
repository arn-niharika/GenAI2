import { useEffect, useState, useCallback } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../components/ThemeProvider';
import { useUser } from '@clerk/clerk-expo';
import { downloadIcon } from '~/assets/svgicons';
import { useFocusEffect } from '@react-navigation/native';
import { useDocumentStore } from '../../../state';
import { LinearGradient } from 'expo-linear-gradient';
import ConfirmModal from '../../../components/ConfirmModal';
import { useAuth } from '@clerk/clerk-expo';

interface Document {
  id: string;
  title: string;
  size: string;
  url: string;
  type?: string;
}

const HomeScreen = () => {
  const { user } = useUser();
  const { isDark, colors } = useTheme();
  const { getToken } = useAuth();

  // Use the document store
  const { documents, loading, fetchDocuments } = useDocumentStore();

  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode] = useState<'list'>('list');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);

  // Add state for confirmation modal
  const [modalVisible, setModalVisible] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Define BASE_URL
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || 'YOUR_BASE_URL_HERE';

  // Fetch documents when the component mounts or when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const token = await getToken()
        if (!token) return;
        fetchDocuments(token);

      }
      fetchData();

    }, [fetchDocuments])
  );

  // Update filtered docs when documents or search query changes
  useEffect(() => {
    if (documents.length > 0) {
      handleSearch(searchQuery);
    } else {
      setFilteredDocs([]);
    }
  }, [documents]);

  // Debounced search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      const filtered = documents.filter((doc) =>
        doc.title?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredDocs(filtered);
      setCurrentPage(1);
    }, 500);
    setDebounceTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  // Handle document download
  const handleDownload = (document: Document) => {
    // Implement download functionality
    console.log('Downloading document:', document.title);
    // You might want to use Linking.openURL(document.url) or a file download library
  };

  // Confirm delete document
  const confirmDeleteDocument = (document: Document) => {
    setDocToDelete(document);
    setModalVisible(true);
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!docToDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`${BASE_URL}/document/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_name: docToDelete.title,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh document list after successful deletion
        const token = await getToken()
        if (!token) return;
        fetchDocuments(token);
      } else {
        console.error('Failed to delete document:', result.message || 'Unknown error');
        alert('Failed to delete document. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('An error occurred while deleting the document.');
    } finally {
      setIsDeleting(false);
      setModalVisible(false);
      setDocToDelete(null);
    }
  };

  // Sort and paginate documents
  const sortedDocuments = filteredDocs.sort((a, b) =>
    sortOrder === 'newest'
      ? b.title.localeCompare(a.title)
      : a.title.localeCompare(b.title)
  );
  const indexOfLastDoc = currentPage * rowsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - rowsPerPage;
  const paginatedDocuments = sortedDocuments.slice(indexOfFirstDoc, indexOfLastDoc);
  const totalPages = Math.ceil(filteredDocs.length / rowsPerPage);

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

  // Render document item with proper layout
  const renderDocumentList = ({ item }: { item: Document }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card || '#E0F2F1',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      }}
    >
      <View style={{ flexDirection: 'column', flex: 1 }}>
        <Image
          source={isDark ? require('../../../assets/file_icon_dark.png') : require('../../../assets/file_icon_li8.png')}
          style={{ width: 32, height: 32 }}
        />
        <View style={{ marginVertical: 10, flex: 1 }}>
          <Text
            style={{
              color: colors.text || '#000000',
              fontSize: 16,
              fontWeight: 'bold',
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',

          }}>
            <Text style={{ color: colors.text || '#000000', fontSize: 12, opacity: 0.5 }}>
              Size: {item.size}
            </Text>
            <TouchableOpacity onPress={() => confirmDeleteDocument(item)}>
              <Ionicons name="trash" size={16} color={colors.deleteIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background || '#FFFFFF' }}>
      {loading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary || '#26A69A'} />
        </View>
      )}
      {!loading && (
        <>
          {/* Search Bar */}
          <View style={{ padding: 16 }}>
            <View style={{ width: '100%', position: 'relative' }}>
              <TextInput
                style={{
                  backgroundColor: colors.searchbg || '#E0E0E0',
                  borderRadius: 10,
                  padding: 10,
                  paddingLeft: 40,
                  color: colors.text,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1,
                  height: 40,
                }}
                placeholder="Search"
                placeholderTextColor={colors.searchPlaceholder}
                value={searchQuery}
                onChangeText={handleSearch}
              />

              <Ionicons
                name="search"
                size={18}
                color={colors.searchPlaceholder}
                style={{ position: 'absolute', left: 10, top: 12 }}
              />
            </View>
          </View>

          {/* Document List */}
          <FlatList
            data={paginatedDocuments}
            renderItem={renderDocumentList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          />

          {/* Pagination */}
          <View
            className='flex w-full'
            style={{
              backgroundColor: colors.background || '#FFFFFF',
              padding: 16,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1,
              flexDirection: 'column',
            }}
          >
            {/* Rows per page selector - Similar to OrderTable.tsx */}
            <View className="flex flex-row items-center mb-2" style={{ position: 'relative' }}>
              <Text className="text-sm opacity-50 mr-2" style={{ color: colors.text }}>
                Rows per page
              </Text>
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  className="rounded px-1.5 py-1 flex flex-row items-center justify-between w-[50px]"
                  style={{ backgroundColor: colors.searchbg }}
                  onPress={() => setShowRowsDropdown(prev => !prev)}
                >
                  <Text className="text-xs opacity-50" style={{ color: colors.text }}>
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
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      backgroundColor: isDark ? '#343434' : '#FFFFFF',
                      borderRadius: 8,
                      padding: 8,
                      width: 100,
                      zIndex: 10,
                      elevation: 5,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}
                  >
                    {[5, 10, 15].map(num => (
                      <TouchableOpacity
                        key={num}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderBottomWidth: num !== 24 ? 1 : 0,
                          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        }}
                        onPress={() => {
                          setRowsPerPage(num);
                          setCurrentPage(1);
                          setShowRowsDropdown(false);
                        }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 14,
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

              {/* Current page indicator */}
              <Text style={{ color: colors.text, marginLeft: 'auto' }}>
                Page {currentPage} of {totalPages}
              </Text>
            </View>

            {/* prev next buttons - taking half width each */}
            <View className='flex w-full' style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                style={{
                  width: '48%',
                  borderRadius: 12,
                  overflow: 'hidden',
                  height: 47,
                }}
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
                onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                style={{
                  width: '48%',
                  borderRadius: 12,
                  overflow: 'hidden',
                  height: 47,
                }}
              >
                {currentPage === totalPages || totalPages === 0 ? (
                  <LinearGradient
                    colors={['#2F9A92', '#2C72FF']}
                    locations={[0, 1]}
                    start={{ x: 0.54, y: 0.41 }}
                    end={{ x: 0.49, y: 1.5 }}
                    style={{
                      paddingVertical: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
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

          </View>

          {/* Page numbers */}
          <View className='flex w-full' style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 16, gap: 16 }}>
            {getPageNumbers().map((page, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={typeof page !== 'number'}
                style={{
                  padding: 4,
                  marginHorizontal: 2,
                  backgroundColor:
                    page === currentPage ? 'transparent' : colors.searchbg,
                  borderRadius: 4,
                  minWidth: 46,
                  height: 28,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                  }}
                >
                  {page}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isVisible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setDocToDelete(null);
        }}
        onConfirm={handleDeleteDocument}
        title="Confirm Delete"
        message={`Deleting this document will erase the knowledge.\nAre you sure you want to delete "${docToDelete?.title || ''}"?`}
      />
    </View>
  );
};

export default HomeScreen;
