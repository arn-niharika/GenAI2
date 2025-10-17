
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import {
  Plus,
  Grid,
  List,
  ChevronRight,
  ChevronDown,
  Folder as LucideFolder,
  FileType,
  File as LucideFile,
  ArrowLeft,
  Menu,
  X,
  Search,
  Trash2,
  Eye,
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import UploadModal from '../../../components/UploadModal'; // Placeholder
import Logs from '../../../components/Logs'; // Placeholder
import { useFileStore } from '../../../state/fileStore'; // Adjust path
import { useAuth } from '@clerk/clerk-expo'; // Clerk for Expo
import { notify } from '../../../utils/utils'; // Adjust path for toast
import { useTheme } from '../../../components/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { MultiSeclectIcon } from '~/assets/svgicons';

// Types (from your utils; assume imported)
type FileItem = { id: string; name: string; type: string; size: string; date: string; folderId: string };
type Folder = { id: string; name: string; children: Folder[] };
type FolderTreeProps = {
  folders: Folder[];
  files: FileItem[];
  selected: string;
  onSelect: (id: string) => void;
  expanded: string[];
  onToggle: (id: string) => void;
  level?: number;
};


// Helper: Render folder tree recursively (use ScrollView for tree)
const FolderTree: React.FC<FolderTreeProps> = ({ folders, files, selected, onSelect, expanded, onToggle, level = 0 }) => {
  const { colors } = useTheme();


  return (
    <View style={level === 0 ? {} : [{ borderLeftWidth: 1, borderLeftColor: '#374151', paddingLeft: 8 }, { marginLeft: 16 }]}>
      {folders.map((folder: Folder) => (
        <View key={folder.id}>
          <TouchableOpacity
            style={[
              { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
              selected === folder.id && { backgroundColor: '#333' },
            ]}
            onPress={() => onSelect(folder.id)}
          >
            <TouchableOpacity
              style={{ padding: 2 }}
              onPress={(e) => {
                e.stopPropagation();
                onToggle(folder.id);
              }}
            >
              {expanded.includes(folder.id) ? (
                <ChevronDown size={16} color="white" />
              ) : (
                <ChevronRight size={16} color="white" />
              )}
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <LucideFolder size={16} color='#2F9A92' />
              <Text style={{ color: colors.primaryText }}>{folder.name}</Text>
            </View>
          </TouchableOpacity>
          {expanded.includes(folder.id) && (
            <>
              <FolderTree
                folders={folder.children}
                files={files}
                selected={selected}
                onSelect={onSelect}
                expanded={expanded}
                onToggle={onToggle}
                level={level + 1}
              />
              {files
                .filter((f) => f.folderId === folder.id)
                .map((file) => (
                  <TouchableOpacity
                    key={file.id}
                    style={{ paddingLeft: 20, paddingRight: 8, paddingVertical: 4 }}
                    onPress={() => onSelect(file.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {file.type === 'pdf' ? (
                        <FileType size={14} color="#2C72FF" />
                      ) : (
                        <LucideFile size={14} color="#2C72FF" />
                      )}
                      <Text style={{ color: colors.primaryText }}>{file.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </>
          )}
        </View>
      ))}
    </View>
  );
};

// Helper functions (same as web)
const sortFolders = (folders: Folder[], order: 'asc' | 'desc') =>
  [...folders].sort((a, b) =>
    order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );

const sortFiles = (files: FileItem[], sortBy: 'name' | 'date', order: 'asc' | 'desc') =>
  [...files].sort((a, b) => {
    if (sortBy === 'name') {
      return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else {
      return order === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

const getBreadcrumbPath = (folderId: string, root: Folder) => {
  if (!root || !folderId) return [];
  if (folderId === root.id) return [{ id: root.id, name: root.name }];
  let path: { id: string; name: string }[] = [];
  function traverse(folder: Folder, acc: { id: string; name: string }[]): boolean {
    acc.push({ id: folder.id, name: folder.name });
    if (folder.id === folderId) return true;
    for (const child of folder.children) {
      if (traverse(child, acc)) return true;
    }
    acc.pop();
    return false;
  }
  traverse(root, path);
  return path;
};

const findFoldersById = (folder: Folder | null, id: string): Folder | null => {
  if (!folder) return null;
  if (folder.id === id) return folder;
  for (const child of folder.children || []) {
    const found = findFoldersById(child, id);
    if (found) return found;
  }
  return null;
};

const folderSizeCount = (folder: Folder, files: FileItem[]) =>
  files.filter((file) => file.folderId === folder.id).length + (folder?.children.length || 0);

const Home: React.FC = () => {
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  // Store
  const {
    currentPath,
    folders,
    files,
    loading,
    error,
    uploadFile,
    createFolder,
    deleteItem,
    setCurrentPath,
    listFiles,
  } = useFileStore();

  const { getToken } = useAuth();

  // States (same as web)
  const [selectedFolder, setSelectedFolder] = useState('root');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>(['root']);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ id: string; type: 'file' | 'folder' }[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showLogs, setShowLogs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);

  // Filtered/Sorted/Paginated data
  const filteredFiles = files.filter(
    (f) => f.folderId === selectedFolder && f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedFiles = sortFiles(filteredFiles, sortBy, sortOrder);
  const indexOfLastFile = currentPage * itemsPerPage;
  const indexOfFirstFile = indexOfLastFile - itemsPerPage;
  const paginatedFiles = sortedFiles.slice(indexOfFirstFile, indexOfLastFile);

  const visibleFoldersRaw =
    folders[0]?.id === selectedFolder
      ? folders[0].children
      : findFoldersById(folders[0], selectedFolder)?.children || [];
  const filteredFolders = visibleFoldersRaw.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedFolders = sortFolders(filteredFolders, sortOrder);
  const paginatedFolders = sortedFolders.slice(indexOfFirstFile, indexOfLastFile);

  const totalPages = Math.max(1, Math.ceil((sortedFolders.length + sortedFiles.length) / itemsPerPage));
  const breadcrumbPath = getBreadcrumbPath(selectedFolder, folders[0]);

  // Handlers (adapted)
  const handleSelect = (id: string) => {
    if (files.some((f) => f.id === id)) return;
    if (showLogs) setShowLogs(!showLogs);
    setSelectedFolder(id);
    setCurrentPath(`${id}`);
    setIsSideBarOpen(false);
  };

  const handleToggle = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handlePreview = async (fileId: string) => {
    const url = `/preview?id=${encodeURIComponent(fileId)}`;
    await Linking.openURL(url); // Opens in browser; adapt to navigation if needed
  };

  const handleDeleteItem = (id: string, type: 'file' | 'folder') => {
    setSelectedItems([{ id, type }]);
    setShowDeleteModal(true);
  };

  const handleDeleteMultipleItems = () => {
    setShowDeleteModal(true);
  };

  const confirmMultiDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      await Promise.all(
        selectedItems.map(async (item) => {
          await deleteItem(getToken, item.id);
        })
      );
      if (!error) {
        notify(selectedItems.length === 1 ? 'Item deleted successfully' : 'Items deleted successfully');
      }
    } catch (err) {
      notify('Error deleting multiple items', 'error');
      console.error('Error deleting multiple items:', err);
    }
    setSelectedItems([]);
    setMultiSelectMode(false);
    setShowDeleteModal(false);
  };

  const toggleMultiSelect = () => {
    setMultiSelectMode(!multiSelectMode);
    if (multiSelectMode) {
      setSelectedItems([]);
    }
  };

  const selectAllItems = () => {
    const totalVisible = paginatedFiles.length + paginatedFolders.length;
    const allSelected = selectedItems.length === totalVisible && totalVisible > 0;
    if (allSelected) {
      setSelectedItems([]);
    } else {
      const filesToSelect = paginatedFiles.map((f) => ({ id: f.id, type: 'file' as const }));
      const foldersToSelect = paginatedFolders.map((folder) => ({ id: folder.id, type: 'folder' as const }));
      setSelectedItems([...filesToSelect, ...foldersToSelect]);
    }
  };

  const toggleSideBar = () => {
    setIsSideBarOpen(!isSideBarOpen);
  };

  const handleMainClick = () => {
    if (isSideBarOpen) {
      setIsSideBarOpen(false);
    }
  };

  useEffect(() => {
    listFiles(getToken, currentPath, searchQuery, sortBy, sortOrder, currentPage, itemsPerPage);
  }, [currentPath, searchQuery, sortBy, sortOrder, currentPage, itemsPerPage]);

  useEffect(() => {
    const subscription = {
      contextMenu: () => { }, // RN doesn't have context menu; ignore
    };
    return () => {
      // Cleanup if needed
    };
  }, []);

  const renderListItem = ({ item }: { item: FileItem | Folder }) => {
    const isFolder = 'children' in item;
    if (isFolder) {
      const folder = item as Folder;
      return (
        <TouchableOpacity
          style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderRadius: 4 }, {}]}
          onPress={() => handleSelect(folder.id)}
        >
          {/* Checkbox if multi */}
          {multiSelectMode && (
            <TouchableOpacity
              style={{ width: 16, height: 16, marginRight: 8 }}
              onPress={(e) => e.stopPropagation()}
              onLongPress={() => { }} // For selection
            >
              {/* Custom checkbox logic */}
              <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: '#374151', borderWidth: 1, borderColor: '#4b5563' }} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LucideFolder size={20} color='#2F9A92' />
            <Text style={{ color: colors.primaryText, fontSize: 14 }}>{folder.name}</Text>
          </View>
          <Text style={{ flex: 1, color: colors.primaryText, fontSize: 14, textAlign: 'center' }}>folder</Text>
          <Text style={{ flex: 1, color: colors.primaryText, fontSize: 14, textAlign: 'center' }}>{folderSizeCount(folder, files)}</Text>
          <Text style={{ flex: 1, color: colors.primaryText, fontSize: 14, textAlign: 'center' }} >---</Text>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteItem(folder.id, 'folder'); }}>
              <Trash2 size={16} color="#65557c" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    } else {
      const file = item as FileItem;
      return (
        <TouchableOpacity style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderRadius: 4 }, {}]}>
          {multiSelectMode && (
            <TouchableOpacity
              style={{ width: 16, height: 16, marginRight: 8 }}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: '#374151', borderWidth: 1, borderColor: '#4b5563' }} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {file.type === 'pdf' ? (
              <FileType size={20} color="#2C72FF" />
            ) : (
              <LucideFile size={20} color="#2C72FF" />
            )}
            <Text style={{ color: colors.primaryText, fontSize: 14 }}>{file.name}</Text>
          </View>
          <Text style={{ flex: 1, color: colors.primaryText, fontSize: 14, textAlign: 'center' }}>{file.type}</Text>
          <Text style={{ flex: 1, color: colors.primaryText, fontSize: 14, textAlign: 'center' }}>{file.size}</Text>
          <Text style={{ flex: 1, color: colors.primaryText, fontSize: 14, textAlign: 'center' }}>{file.date}</Text>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => handlePreview(file.id)}>
              <Eye size={18} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteItem(file.id, 'file');
              }}
            >
              <Trash2 size={16} color="#65557c" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const renderGridItem = ({ item }: { item: FileItem | Folder }) => {
    const isFolder = 'children' in item;
    if (isFolder) {
      const folder = item as Folder;
      return (
        <TouchableOpacity
          style={[
            { flex: 1, backgroundColor: colors.secondaryBackground, padding: 12, margin: 4, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, alignItems: 'flex-start' },
            selectedFolder === folder.id && { borderWidth: 2, borderColor: '#2C72FF' },
          ]}
          onPress={() => handleSelect(folder.id)}
        >
          {multiSelectMode && <View style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, backgroundColor: '#374151', borderRadius: 4 }} />}
          <LucideFolder
            size={20}
            color={selectedFolder === folder.id ? '#2C72FF' : '#2F9A92'}
          />
          <Text
            style={[
              { fontWeight: 'bold', color: colors.primaryText, fontSize: 14, marginBottom: 4, marginTop: 4 },
              selectedFolder === folder.id && { color: '#2C72FF' },
            ]}
            numberOfLines={1}
          >
            {folder.name}
          </Text>
          <Text style={{ color: 'gray', fontSize: 12 }}>Size: {folderSizeCount(folder, files)}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignSelf: 'flex-end' }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteItem(folder.id, 'folder');
              }}
            >
              <Trash2 size={16} color={colors.brandPrimary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    } else {
      const file = item as FileItem;
      return (
        <TouchableOpacity style={{ flex: 1, backgroundColor: colors.secondaryBackground, padding: 12, margin: 4, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, alignItems: 'flex-start' }}>
          {multiSelectMode && <View style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, backgroundColor: '#374151', borderRadius: 4 }} />}
          {file.type === 'pdf' ? (
            <FileType size={20} color="#2C72FF" />
          ) : (
            <LucideFile size={20} color="#2C72FF" />
          )}
          <Text style={{ fontWeight: 'bold', color: colors.primaryText, fontSize: 14, marginBottom: 4, marginTop: 4 }} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={{ color: 'gray', fontSize: 12 }}>Date: {file.date}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignSelf: 'flex-end' }}>
            <TouchableOpacity onPress={() => handlePreview(file.id)}>
              <Eye size={18} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteItem(file.id, 'file')}>
              <Trash2 size={16} color="#65557c" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const allItems = [...paginatedFolders, ...paginatedFiles];
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.secondaryBackground }}>


      {/* Main Layout */}
      <View style={{ flex: 1, backgroundColor: colors.secondaryBackground, overflow: 'hidden' }} onTouchStart={handleMainClick}>
        {/* Sidebar */}
        <Modal
          visible={isSideBarOpen}
          animationType="slide"
          onRequestClose={() => setIsSideBarOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: '#232323', borderRightWidth: 2, borderRightColor: 'rgba(var(--brand-secondary), 0.3)', padding: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                onPress={() => handleSelect('root')}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: colors.primaryText }}>Folders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsSideBarOpen(false)}
                style={{ padding: 4 }}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              <FolderTree
                folders={folders}
                files={files}
                selected={selectedFolder}
                onSelect={handleSelect}
                expanded={expanded}
                onToggle={handleToggle}
              />
            </ScrollView>
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(var(--brand-secondary), 0.2)', paddingTop: 8 }}>
              <TouchableOpacity
                style={{ padding: 4 }}
                onPress={() => {
                  setShowLogs(!showLogs);
                  setIsSideBarOpen(false);
                }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: colors.primaryText }}>Logs</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Overlay for sidebar close */}
        {isSideBarOpen && (
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: -1 }}
            onPress={toggleSideBar}
            activeOpacity={1}
          />
        )}

        {/* Main Content */}
        <View style={{ flex: 1, zIndex: 10, backgroundColor: colors.secondaryBackground }}>
          {showLogs ? (
            <Logs toggleSideBar={toggleSideBar} isSideBarOpen={isSideBarOpen} />
          ) : (
            <>
              {/* Breadcrumbs */}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.secondaryBackground, gap: 8 }}>
                <TouchableOpacity onPress={toggleSideBar} style={{ padding: 4 }}>
                  <Menu size={24} color={colors.primaryText} />
                </TouchableOpacity>
                <LinearGradient
                  colors={['#2F9A92', '#2C72FF']}
                  locations={[0, 1]}
                  start={{ x: 0.54, y: 0.41 }}
                  end={{ x: 0.49, y: 1.5 }}
                  style={[
                    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.brandSecondary },
                    breadcrumbPath.length === 1 && { opacity: 0.5 },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      { flexDirection: 'row', alignItems: 'center', gap: 4, },
                      breadcrumbPath.length === 1 && { opacity: 0.5 },
                    ]}
                    onPress={() => {
                      if (breadcrumbPath.length > 1) {
                        handleSelect(breadcrumbPath[breadcrumbPath.length - 2].id);
                      }
                    }}
                    disabled={breadcrumbPath.length === 1}
                  >
                    <ArrowLeft size={18} color={colors.primaryText} />
                    <Text style={{ color: colors.primaryText, fontSize: 16 }}>Back</Text>
                  </TouchableOpacity>

                </LinearGradient>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  {breadcrumbPath.map((crumb, idx) => (
                    <View key={crumb.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity
                        disabled={idx === breadcrumbPath.length - 1}
                        onPress={() => handleSelect(crumb.id)}
                        style={[
                          { paddingHorizontal: 4 },
                        ]}
                      >
                        <Text
                          style={[
                            { color: colors.brandPrimary, fontSize: 14 },
                            idx === breadcrumbPath.length - 1 && { color: colors.primaryText, fontWeight: 'bold' },
                          ]}
                        >
                          {crumb.name}
                        </Text>
                      </TouchableOpacity>
                      {idx < breadcrumbPath.length - 1 && (
                        <Text style={{ color: colors.secondaryText, paddingHorizontal: 4 }}> / </Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Controls */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 2, borderBottomColor: 'rgba(#2F9A92, 0.3)', backgroundColor: colors.secondaryBackground, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.secondaryBackground, borderRadius: 12, paddingHorizontal: 8, minWidth: 120 }}>
                    <Search size={20} color={colors.secondaryText} />
                    <TextInput
                      style={{ flex: 1, color: colors.primaryText, fontSize: 14 }}
                      placeholder="Search..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor={colors.secondaryText}
                    />
                  </View>
                  <LinearGradient
                    colors={['#2F9A92', '#2C72FF']}
                    locations={[0, 1]}
                    start={{ x: 0.54, y: 0.41 }}
                    end={{ x: 0.49, y: 1.5 }}
                    style={{ gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'var(--primary-gradient)', borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 }}
                  >
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => setModalOpen(true)}>
                      <Plus size={16} color="white" />
                      <Text style={{ color:"white", fontSize: 14 }}>Upload File</Text>
                    </TouchableOpacity>
                  </LinearGradient>

                  <LinearGradient
                    colors={['#2F9A92', '#2C72FF']}
                    locations={[0, 1]}
                    start={{ x: 0.54, y: 0.41 }}
                    end={{ x: 0.49, y: 1.5 }}
                    style={{ gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'var(--primary-gradient)', borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 }}
                  >
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => setShowCreateModal(true)}>
                      <Plus size={16} color="white" />
                      <Text style={{ color: "white", fontSize: 14 }}>Create Folder</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                  <LinearGradient
                    colors={['#2F9A92', '#2C72FF']}
                    locations={[0, 1]}
                    start={{ x: 0.54, y: 0.41 }}
                    end={{ x: 0.49, y: 1.5 }}
                    style={{ padding: 4, borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 }}
                  >
                    <TouchableOpacity
                      onPress={() => setView(view === 'list' ? 'grid' : 'list')}
                    >
                      {view === 'list' ? <Grid size={16} color="white" /> : <List size={16} color="white" />}
                    </TouchableOpacity>
                  </LinearGradient>

                  <LinearGradient
                    colors={['#2F9A92', '#2C72FF']}
                    locations={[0, 1]}
                    start={{ x: 0.54, y: 0.41 }}
                    end={{ x: 0.49, y: 1.5 }}
                   style={[
                        { padding: 4, borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 },
                        multiSelectMode && { backgroundColor: '#ef4444' },
                      ]}
                  >
                    <TouchableOpacity
                      
                      onPress={toggleMultiSelect}
                    >
                      {/* Custom check icon SVG as Touchable */}
                      {MultiSeclectIcon()}
                      {/* <Text style={{ color: "white", fontSize: 16, fontWeight: 'bold' }}>✓</Text> */}
                    </TouchableOpacity>

                  </LinearGradient>

                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor:colors.primaryText}}>
                  <Text style={{ color: colors.primaryText, fontSize: 14, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'var(--primary-gradient)', borderRadius: 999 }}>Sort:</Text>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#181818', borderWidth: 1, borderColor: 'rgba(var(--brand-secondary), 0.4)', borderRadius: 4, minWidth: 40 }}
                    onPress={() => setShowSortPicker(true)}
                  >
                    <Text style={{ color: colors.primaryText, fontSize: 14 }}>{sortBy === 'name' ? 'Name' : 'Date'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#2F9A92', borderRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 }}
                    onPress={() => setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))}
                  >
                    <Text style={{ color: colors.primaryText, fontSize: 14 }}>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Multi-select bar */}
              {multiSelectMode && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: 'rgba(var(--brand-secondary), 0.3)' }}>
                  <Text style={{ color: colors.primaryText, fontSize: 14 }}>{selectedItems.length} item(s) selected</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={selectAllItems}>
                      <Text style={{ color: '#2F9A92', fontSize: 14, textDecorationLine: 'underline' }}>
                        {selectedItems.length === paginatedFiles.length + paginatedFolders.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#ef4444', borderRadius: 4 }}
                      onPress={handleDeleteMultipleItems}
                      disabled={selectedItems.length === 0}
                    >
                      <Text style={{ color: colors.primaryText, fontSize: 14 }}>Delete ({selectedItems.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#4b5563', borderRadius: 4 }} onPress={toggleMultiSelect}>
                      <Text style={{ color: colors.primaryText, fontSize: 14 }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Content List/Grid */}
              <View style={{ flex: 1, padding: 12, backgroundColor: colors.secondaryBackground }}>
                {allItems.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: colors.primaryText, fontSize: 16, marginTop: 50 }}>No Folders and Files available</Text>
                ) : view === 'list' ? (
                  <FlatList
                    data={allItems}
                    keyExtractor={(item) => ('id' in item ? item.id : Math.random().toString())}
                    renderItem={renderListItem}
                    ListHeaderComponent={
                      <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: colors.primaryText, marginBottom: 8 }}>
                        {multiSelectMode && <View style={{ width: 32 }} />}
                        <Text style={{ flex: 1, color: colors.primaryText, fontSize: 14, textAlign: 'center' }}>Name</Text>
                        <Text style={{ flex: 1, color: colors.primaryText, fontSize: 14, textAlign: 'center' }}>Type</Text>
                        <Text style={{ flex: 1, color:colors.primaryText, fontSize: 14, textAlign: 'center' }}>Size</Text>
                        <Text style={{ flex: 1, color:colors.primaryText, fontSize: 14, textAlign: 'center' }}>Date</Text>
                        <Text style={{ flex: 1, color:colors.primaryText, fontSize: 14, textAlign: 'center' }}>Actions</Text>
                      </View>
                    }
                    stickyHeaderIndices={[0]}
                  />
                ) : (
                  <FlatList
                    data={allItems}
                    keyExtractor={(item) => ('id' in item ? item.id : Math.random().toString())}
                    renderItem={renderGridItem}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                  />
                )}
              </View>

              {/* Pagination */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 8, borderTopWidth: 1, borderTopColor: '#1f2937', backgroundColor:colors.secondaryBackground, gap: 4 }}>
                <LinearGradient
                  colors={['#2F9A92', '#2C72FF']}
                  locations={[0, 1]}
                  start={{ x: 0.54, y: 0.41 }}
                  end={{ x: 0.49, y: 1.5 }}
                  style={[{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }, currentPage === 1 && { opacity: 0.5 }]}
                >
                  <TouchableOpacity
                  
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <Text style={{ color: colors.primaryText, fontSize: 14 }}>{'<'}</Text>
                </TouchableOpacity>
                </LinearGradient>
                
                {[...Array(totalPages)].map((_, i) => (
                  <LinearGradient
                    key={i}
                  colors={['#2F9A92', '#2C72FF']}
                  locations={[0, 1]}
                  start={{ x: 0.54, y: 0.41 }}
                  end={{ x: 0.49, y: 1.5 }}
                  style={[
                      { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#374151', borderRadius: 4 },
                      currentPage === i + 1 && { backgroundColor: 'var(--primary-gradient)' },
                    ]}
                    
                >
                  <TouchableOpacity
                  
                    onPress={() => setCurrentPage(i + 1)}
                  >
                    <Text style={{ color: colors.primaryText, fontSize: 14 }}>{i + 1}</Text>
                  </TouchableOpacity>
                </LinearGradient>
                  
                ))}

                <LinearGradient
                  colors={['#2F9A92', '#2C72FF']}
                  locations={[0, 1]}
                  start={{ x: 0.54, y: 0.41 }}
                  end={{ x: 0.49, y: 1.5 }}
                 style={[{ paddingHorizontal: 8, paddingVertical: 4,borderRadius: 4 }, currentPage === totalPages && { opacity: 0.5 }]}
                >
                  <TouchableOpacity
                  
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Text style={{ color: colors.primaryText, fontSize: 14 }}>{'>'}</Text>
                </TouchableOpacity>
                </LinearGradient>
                
              </View>
            </>
          )}
        </View>
      </View>

      {/* Sort Picker Modal */}
      <Modal visible={showSortPicker} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.primaryText, padding: 20, borderRadius: 8, width: '80%' }}>
            <Picker
              selectedValue={sortBy}
              onValueChange={(value) => {
                setSortBy(value as 'name' | 'date');
                setShowSortPicker(false);
              }}
              style={{ height: 150 }}
            >
              <Picker.Item label="Name" value="name" />
              <Picker.Item label="Date" value="date" />
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Upload Modal */}
      {modalOpen && (
        <UploadModal
          closeModal={() => setModalOpen(false)}
          handleFileUpload={async (file: any) => {
            await uploadFile(getToken, file, currentPath);
            return true;
          }}
        />
      )}

      {/* Create Folder Modal */}
      <Modal visible={showCreateModal} animationType="fade" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#232323', padding: 24, borderRadius: 8, width: 320 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: colors.primaryText, marginBottom: 8 }}>Create Folder</Text>
            <TextInput
              style={{ backgroundColor: '#181818', borderWidth: 1, borderColor: '#374151', borderRadius: 4, padding: 8, color: colors.primaryText, marginBottom: 16 }}
              placeholder="Folder name"
              value={newFolderName}
              onChangeText={setNewFolderName}
              onSubmitEditing={async () => {
                if (newFolderName.trim()) {
                  await createFolder(getToken, newFolderName.trim(), currentPath);
                  setNewFolderName('');
                  setShowCreateModal(false);
                }
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#374151', borderRadius: 4 }}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={{ color: colors.primaryText, fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'var(--primary-gradient)', borderRadius: 4 }, loading && { opacity: 0.5 }]}
                onPress={async () => {
                  if (newFolderName.trim()) {
                    await createFolder(getToken, newFolderName.trim(), currentPath);
                    setNewFolderName('');
                    setShowCreateModal(false);
                  }
                }}
                disabled={loading}
              >
                <Text style={{ color: colors.primaryText, fontSize: 14 }}>{loading ? 'Loading..' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#232323', padding: 24, borderRadius: 8, width: 320 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: colors.primaryText, marginBottom: 8 }}>
              {selectedItems.length > 1 ? `Delete ${selectedItems.length} Item(s)` : 'Delete Item'}
            </Text>
            <Text style={{ color: colors.primaryText, fontSize: 14, marginBottom: 16 }}>
              {selectedItems.length > 1
                ? `Are you sure you want to delete ${selectedItems.length} selected item(s)? This action cannot be undone.`
                : `Are you sure you want to delete ${files.find((f) => f.id === selectedItems[0]?.id && selectedItems[0]?.type === 'file')?.name ||
                folders.find((f) => f.id === selectedItems[0]?.id && selectedItems[0]?.type === 'folder')?.name ||
                'this item'
                }? This action cannot be undone.`}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#374151', borderRadius: 4 }}
                onPress={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                <Text style={{ color: colors.primaryText, fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#ef4444', borderRadius: 4 }, loading && { opacity: 0.5 }]}
                onPress={confirmMultiDelete}
                disabled={loading}
              >
                <Text style={{ color: colors.primaryText, fontSize: 14 }}>
                  {loading
                    ? 'Deleting..'
                    : selectedItems.length > 1
                      ? `Delete ${selectedItems.length} Items`
                      : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;
