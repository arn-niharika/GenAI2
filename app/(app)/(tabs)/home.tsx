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
// Import your Header component (adapt path)
// import Header from '../../../components/Header';
// Assume these are provided later; placeholders here
import UploadModal from '../../../components/UploadModal'; // Placeholder
import Logs from '../../../components/Logs'; // Placeholder
import { useFileStore } from '../../../state/fileStore'; // Adjust path
import { useAuth } from '@clerk/clerk-expo'; // Clerk for Expo
import { notify } from '../../../utils/utils'; // Adjust path for toast
import { useTheme } from '../../../components/ThemeProvider';



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
  return (
    <View style={level === 0 ? styles.treeRoot : [styles.treeChild, { marginLeft: 16 }]}>
      {folders.map((folder: Folder) => (
        <View key={folder.id}>
          <TouchableOpacity
            style={[
              styles.folderButton,
              selected === folder.id && styles.selectedFolder,
            ]}
            onPress={() => onSelect(folder.id)}
          >
            <TouchableOpacity
              style={styles.expandIcon}
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
            <View style={styles.folderIconName}>
              <LucideFolder size={16} color='#2F9A92' />
              <Text style={styles.folderName}>{folder.name}</Text>
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
                    style={styles.fileItem}
                    onPress={() => onSelect(file.id)}
                  >
                    <View style={styles.fileIconName}>
                      {file.type === 'pdf' ? (
                        <FileType size={14} color="#2C72FF" />
                      ) : (
                        <LucideFile size={14} color="#2C72FF" />
                      )}
                      <Text style={styles.fileName}>{file.name}</Text>
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
      contextMenu: () => {}, // RN doesn't have context menu; ignore
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
          style={[styles.listRow, styles.hoverRow]}
          onPress={() => handleSelect(folder.id)}
        >
          {/* Checkbox if multi */}
          {multiSelectMode && (
            <TouchableOpacity
              style={styles.checkbox}
              onPress={(e) => e.stopPropagation()}
              onLongPress={() => {}} // For selection
            >
              {/* Custom checkbox logic */}
              <View style={styles.checkboxView} />
            </TouchableOpacity>
          )}
          <View style={styles.rowName}>
            <LucideFolder size={20} color='#2F9A92' />
            <Text style={styles.rowText}>{folder.name}</Text>
          </View>
          <Text style={styles.rowCenter}>folder</Text>
          <Text style={styles.rowCenter}>{folderSizeCount(folder, files)}</Text>
          <Text style={styles.rowCenter}>---</Text>
          <View style={styles.rowActions}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteItem(folder.id, 'folder'); }}>
              <Trash2 size={16} color="#65557c" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    } else {
      const file = item as FileItem;
      return (
        <TouchableOpacity style={[styles.listRow, styles.hoverRow]}>
          {multiSelectMode && (
            <TouchableOpacity
              style={styles.checkbox}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.checkboxView} />
            </TouchableOpacity>
          )}
          <View style={styles.rowName}>
            {file.type === 'pdf' ? (
              <FileType size={20} color="#2C72FF" />
            ) : (
              <LucideFile size={20} color="#2C72FF" />
            )}
            <Text style={styles.rowText}>{file.name}</Text>
          </View>
          <Text style={styles.rowCenter}>{file.type}</Text>
          <Text style={styles.rowCenter}>{file.size}</Text>
          <Text style={styles.rowCenter}>{file.date}</Text>
          <View style={styles.rowActions}>
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
          style={[styles.gridItem, selectedFolder === folder.id && styles.selectedGrid]}
          onPress={() => handleSelect(folder.id)}
        >
          {multiSelectMode && <View style={styles.gridCheckbox} />}
          <LucideFolder
            size={20}
            color={selectedFolder === folder.id ? '#2C72FF' : '#2F9A92'}
          />
          <Text
            style={[
              styles.gridName,
              selectedFolder === folder.id && { color: '#2C72FF' },
            ]}
            numberOfLines={1}
          >
            {folder.name}
          </Text>
          <Text style={styles.gridMeta}>Size: {folderSizeCount(folder, files)}</Text>
          <View style={styles.gridActions}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteItem(folder.id, 'folder');
              }}
            >
              <Trash2 size={16} color="#65557c" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    } else {
      const file = item as FileItem;
      return (
        <TouchableOpacity style={styles.gridItem}>
          {multiSelectMode && <View style={styles.gridCheckbox} />}
          {file.type === 'pdf' ? (
            <FileType size={20} color="#2C72FF" />
          ) : (
            <LucideFile size={20} color="#2C72FF" />
          )}
          <Text style={styles.gridName} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={styles.gridMeta}>Date: {file.date}</Text>
          <View style={styles.gridActions}>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <Header />
      </View> */}

      {/* Main Layout */}
      <View style={styles.main} onTouchStart={handleMainClick}>
        {/* Sidebar */}
        <Modal
          visible={isSideBarOpen}
          animationType="slide"
          onRequestClose={() => setIsSideBarOpen(false)}
        >
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity
                style={styles.foldersTitle}
                onPress={() => handleSelect('root')}
              >
                <Text style={styles.foldersText}>Folders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsSideBarOpen(false)}
                style={styles.closeButton}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sidebarContent}>
              <FolderTree
                folders={folders}
                files={files}
                selected={selectedFolder}
                onSelect={handleSelect}
                expanded={expanded}
                onToggle={handleToggle}
              />
            </ScrollView>
            <View style={styles.sidebarFooter}>
              <TouchableOpacity
                style={styles.logsButton}
                onPress={() => {
                  setShowLogs(!showLogs);
                  setIsSideBarOpen(false);
                }}
              >
                <Text style={styles.logsText}>Logs</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Overlay for sidebar close */}
        {isSideBarOpen && (
          <TouchableOpacity
            style={styles.sidebarOverlay}
            onPress={toggleSideBar}
            activeOpacity={1}
          />
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {showLogs ? (
            <Logs toggleSideBar={toggleSideBar} isSideBarOpen={isSideBarOpen} />
          ) : (
            <>
              {/* Breadcrumbs */}
              <View style={styles.breadcrumb}>
                <TouchableOpacity onPress={toggleSideBar} style={styles.menuButton}>
                  <Menu size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.backButton,
                    breadcrumbPath.length === 1 && { opacity: 0.5 },
                  ]}
                  onPress={() => {
                    if (breadcrumbPath.length > 1) {
                      handleSelect(breadcrumbPath[breadcrumbPath.length - 2].id);
                    }
                  }}
                  disabled={breadcrumbPath.length === 1}
                >
                  <ArrowLeft size={18} color="white" />
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breadcrumbPath}>
                  {breadcrumbPath.map((crumb, idx) => (
                    <View key={crumb.id} style={styles.crumb}>
                      <TouchableOpacity
                        disabled={idx === breadcrumbPath.length - 1}
                        onPress={() => handleSelect(crumb.id)}
                        style={[
                          styles.crumbButton,
                        ]}
                      >
                        <Text
                          style={[
                            styles.crumbText,
                            idx === breadcrumbPath.length - 1 && { color: 'white', fontWeight: 'bold' },
                          ]}
                        >
                          {crumb.name}
                        </Text>
                      </TouchableOpacity>
                      {idx < breadcrumbPath.length - 1 && (
                        <Text style={styles.crumbSeparator}> / </Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <View style={styles.controlLeft}>
                  <View style={styles.searchContainer}>
                    <Search size={20} color="gray" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor="gray"
                    />
                  </View>
                  <TouchableOpacity style={styles.actionButton} onPress={() => setModalOpen(true)}>
                    <Plus size={16} color="white" />
                    <Text style={styles.buttonText}>Upload File</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => setShowCreateModal(true)}>
                    <Plus size={16} color="white" />
                    <Text style={styles.buttonText}>Create Folder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewToggle}
                    onPress={() => setView(view === 'list' ? 'grid' : 'list')}
                  >
                    {view === 'list' ? <Grid size={16} color="white" /> : <List size={16} color="white" />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.multiSelectButton,
                      multiSelectMode && styles.multiSelectActive,
                    ]}
                    onPress={toggleMultiSelect}
                  >
                    {/* Custom check icon SVG as Touchable */}
                    <Text style={styles.checkIcon}>✓</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.controlRight}>
                  <Text style={styles.sortLabel}>Sort:</Text>
                  <TouchableOpacity
                    style={styles.sortToggle}
                    onPress={() => setShowSortPicker(true)}
                  >
                    <Text style={styles.sortText}>{sortBy === 'name' ? 'Name' : 'Date'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sortOrderButton}
                    onPress={() => setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))}
                  >
                    <Text style={styles.sortOrderText}>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mobile Controls (if needed; merged above for simplicity) */}

              {/* Multi-select bar */}
              {multiSelectMode && (
                <View style={styles.multiSelectBar}>
                  <Text style={styles.multiSelectText}>{selectedItems.length} item(s) selected</Text>
                  <View style={styles.multiSelectActions}>
                    <TouchableOpacity onPress={selectAllItems}>
                      <Text style={styles.selectAllText}>
                        {selectedItems.length === paginatedFiles.length + paginatedFolders.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={handleDeleteMultipleItems}
                      disabled={selectedItems.length === 0}
                    >
                      <Text style={styles.deleteButtonText}>Delete ({selectedItems.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={toggleMultiSelect}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Content List/Grid */}
              <View style={styles.listContainer}>
                {allItems.length === 0 ? (
                  <Text style={styles.emptyText}>No Folders and Files available</Text>
                ) : view === 'list' ? (
                  <FlatList
                    data={allItems}
                    keyExtractor={(item) => ( 'id' in item ? item.id : Math.random().toString() )}
                    renderItem={renderListItem}
                    ListHeaderComponent={
                      <View style={styles.tableHeader}>
                        {multiSelectMode && <View style={styles.headerCheckbox} />}
                        <Text style={styles.headerText}>Name</Text>
                        <Text style={styles.headerText}>Type</Text>
                        <Text style={styles.headerText}>Size</Text>
                        <Text style={styles.headerText}>Date</Text>
                        <Text style={styles.headerText}>Actions</Text>
                      </View>
                    }
                    stickyHeaderIndices={[0]}
                  />
                ) : (
                  <FlatList
                    data={allItems}
                    keyExtractor={(item) => ( 'id' in item ? item.id : Math.random().toString() )}
                    renderItem={renderGridItem}
                    numColumns={2}
                    columnWrapperStyle={styles.gridRow}
                  />
                )}
              </View>

              {/* Pagination */}
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <Text style={styles.pageText}>{'<'}</Text>
                </TouchableOpacity>
                {[...Array(totalPages)].map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.pageButton,
                      currentPage === i + 1 && styles.activePageButton,
                    ]}
                    onPress={() => setCurrentPage(i + 1)}
                  >
                    <Text style={styles.pageText}>{i + 1}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Text style={styles.pageText}>{'>'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Sort Picker Modal */}
      <Modal visible={showSortPicker} animationType="slide" transparent>
        <View style={styles.pickerModal}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sortBy}
              onValueChange={(value) => {
                setSortBy(value as 'name' | 'date');
                setShowSortPicker(false);
              }}
              style={styles.picker}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Folder</Text>
            <TextInput
              style={styles.modalInput}
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
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createModalButton, loading && styles.disabledButton]}
                onPress={async () => {
                  if (newFolderName.trim()) {
                    await createFolder(getToken, newFolderName.trim(), currentPath);
                    setNewFolderName('');
                    setShowCreateModal(false);
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.createText}>{loading ? 'Loading..' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedItems.length > 1 ? `Delete ${selectedItems.length} Item(s)` : 'Delete Item'}
            </Text>
            <Text style={styles.modalMessage}>
              {selectedItems.length > 1
                ? `Are you sure you want to delete ${selectedItems.length} selected item(s)? This action cannot be undone.`
                : `Are you sure you want to delete ${
                    files.find((f) => f.id === selectedItems[0]?.id && selectedItems[0]?.type === 'file')?.name ||
                    folders.find((f) => f.id === selectedItems[0]?.id && selectedItems[0]?.type === 'folder')?.name ||
                    'this item'
                  }? This action cannot be undone.`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, loading && styles.disabledButton]}
                onPress={confirmMultiDelete}
                disabled={loading}
              >
                <Text style={styles.deleteText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'var(--screen-background)', // From your theme
  },
  header: {
    padding: 8,
    backgroundColor: 'var(--screen-background)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  main: {
    flex: 1,
    backgroundColor: 'var(--screen-background)',
    overflow: 'hidden',
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#232323',
    borderRightWidth: 2,
    borderRightColor: 'rgba(var(--brand-secondary), 0.3)',
    padding: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  foldersTitle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  foldersText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(var(--brand-secondary), 0.2)',
    paddingTop: 8,
  },
  logsButton: {
    padding: 4,
  },
  logsText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: -1,
  },
  content: {
    flex: 1,
    zIndex: 10,
    backgroundColor: 'var(--screen-background)',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'var(--screen-background)',
    gap: 8,
  },
  menuButton: {
    padding: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'var(--primary-gradient)',
    borderWidth: 1,
    borderColor: 'rgba(var(--brand-secondary), 0.4)',
  },
  backText: {
    color: 'white',
    fontSize: 16,
  },
  breadcrumbPath: {
    flex: 1,
  },
  crumb: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crumbButton: {
    paddingHorizontal: 4,
  },
  currentCrumb: {
    // No underline in RN; use bold
    fontWeight: 'bold',
  },
  crumbText: {
    color: '#2F9A92',
    fontSize: 14,
  },
  crumbSeparator: {
    color: 'gray',
    paddingHorizontal: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(#2F9A92, 0.3)',
    backgroundColor: '#232323',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
    minWidth: 120,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'var(--primary-gradient)',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
  viewToggle: {
    padding: 4,
    backgroundColor: 'var(--primary-gradient)',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  multiSelectButton: {
    padding: 4,
    backgroundColor: 'var(--primary-gradient)',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  multiSelectActive: {
    backgroundColor: '#ef4444',
  },
  checkIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    color: 'white',
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'var(--primary-gradient)',
    borderRadius: 999,
  },
  sortToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(var(--brand-secondary), 0.4)',
    borderRadius: 4,
    minWidth: 40,
  },
  sortText: {
    color: 'white',
    fontSize: 14,
  },
  sortOrderButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#2F9A92',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sortOrderText: {
    color: 'white',
    fontSize: 14,
  },
  multiSelectBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(var(--brand-secondary), 0.3)',
  },
  multiSelectText: {
    color: 'white',
    fontSize: 14,
  },
  multiSelectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectAllText: {
    color: '#2F9A92',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#4b5563',
    borderRadius: 4,
  },
  cancelText: {
    color: 'white',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: 'var(--screen-background)',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'white',
    marginBottom: 8,
  },
  headerCheckbox: {
    width: 32,
  },
  headerText: {
    flex: 1,
    color: 'var(--tb-hd-text)',
    fontSize: 14,
    textAlign: 'center',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 4,
  },
  hoverRow: {
    // Hover not in RN; use press opacity
  },
  checkbox: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  checkboxView: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  rowName: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowText: {
    color: 'white',
    fontSize: 14,
  },
  rowCenter: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  rowActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#232323',
    padding: 12,
    margin: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'flex-start',
  },
  selectedGrid: {
    borderWidth: 2,
    borderColor: '#2C72FF',
  },
  gridCheckbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  gridName: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
    marginTop: 4,
  },
  gridMeta: {
    color: 'gray',
    fontSize: 12,
  },
  gridActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    marginTop: 50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    backgroundColor: '#232323',
    gap: 4,
  },
  pageButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  activePageButton: {
    backgroundColor: 'var(--primary-gradient)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageText: {
    color: 'white',
    fontSize: 14,
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  picker: {
    height: 150,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#232323',
    padding: 24,
    borderRadius: 8,
    width: 320,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
    marginBottom: 8,
  },
  modalMessage: {
    color: 'white',
    fontSize: 14,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 4,
    padding: 8,
    color: 'white',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  createModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'var(--primary-gradient)',
    borderRadius: 4,
  },
  deleteModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  createText: {
    color: 'white',
    fontSize: 14,
  },
  deleteText: {
    color: 'white',
    fontSize: 14,
  },
  treeRoot: {
    // Base tree style
  },
  treeChild: {
    borderLeftWidth: 1,
    borderLeftColor: '#374151',
    paddingLeft: 8,
  },
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  selectedFolder: {
    backgroundColor: '#333',
  },
  expandIcon: {
    padding: 2,
  },
  folderIconName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  folderName: {
    color: 'white',
  },
  fileItem: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 4,
  },
  fileIconName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fileName: {
    color: 'white',
  },
});

export default Home;


// import { useEffect, useState, useCallback } from 'react';
// import { FlatList, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useTheme } from '../../../components/ThemeProvider';
// import { useUser } from '@clerk/clerk-expo';
// import { downloadIcon } from '~/assets/svgicons';
// import { useFocusEffect } from '@react-navigation/native';
// import { useDocumentStore } from '../../../state';
// import { LinearGradient } from 'expo-linear-gradient';
// import ConfirmModal from '../../../components/ConfirmModal';
// import { useAuth } from '@clerk/clerk-expo';

// interface Document {
//   id: string;
//   title: string;
//   size: string;
//   url: string;
//   type?: string;
// }

// const HomeScreen = () => {
//   const { user } = useUser();
//   const { isDark, colors } = useTheme();
//   const { getToken } = useAuth();

//   // Use the document store
//   const { documents, loading, fetchDocuments } = useDocumentStore();

//   const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [viewMode] = useState<'list'>('list');
//   const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState<number>(5);
//   const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
//   const [showRowsDropdown, setShowRowsDropdown] = useState(false);

//   // Add state for confirmation modal
//   const [modalVisible, setModalVisible] = useState(false);
//   const [docToDelete, setDocToDelete] = useState<Document | null>(null);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // Define BASE_URL
//   const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || 'YOUR_BASE_URL_HERE';

//   // Fetch documents when the component mounts or when the screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       const fetchData = async () => {
//         const token = await getToken()
//         if (!token) return;
//         fetchDocuments(token);

//       }
//       fetchData();

//     }, [fetchDocuments])
//   );

//   // Update filtered docs when documents or search query changes
//   useEffect(() => {
//     if (documents.length > 0) {
//       handleSearch(searchQuery);
//     } else {
//       setFilteredDocs([]);
//     }
//   }, [documents]);

//   // Debounced search
//   const handleSearch = (query: string) => {
//     setSearchQuery(query);
//     if (debounceTimer) clearTimeout(debounceTimer);
//     const timer = setTimeout(() => {
//       const filtered = documents.filter((doc) =>
//         doc.title?.toLowerCase().includes(query.toLowerCase())
//       );
//       setFilteredDocs(filtered);
//       setCurrentPage(1);
//     }, 500);
//     setDebounceTimer(timer);
//   };

//   useEffect(() => {
//     return () => {
//       if (debounceTimer) clearTimeout(debounceTimer);
//     };
//   }, [debounceTimer]);

//   // Handle document download
//   const handleDownload = (document: Document) => {
//     // Implement download functionality
//     console.log('Downloading document:', document.title);
//     // You might want to use Linking.openURL(document.url) or a file download library
//   };

//   // Confirm delete document
//   const confirmDeleteDocument = (document: Document) => {
//     setDocToDelete(document);
//     setModalVisible(true);
//   };

//   // Handle document deletion
//   const handleDeleteDocument = async () => {
//     if (!docToDelete) return;

//     try {
//       setIsDeleting(true);

//       const response = await fetch(`${BASE_URL}/document/delete`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           file_name: docToDelete.title,
//         }),
//       });

//       const result = await response.json();

//       if (result.success) {
//         // Refresh document list after successful deletion
//         const token = await getToken()
//         if (!token) return;
//         fetchDocuments(token);
//       } else {
//         console.error('Failed to delete document:', result.message || 'Unknown error');
//         alert('Failed to delete document. Please try again.');
//       }
//     } catch (error) {
//       console.error('Error deleting document:', error);
//       alert('An error occurred while deleting the document.');
//     } finally {
//       setIsDeleting(false);
//       setModalVisible(false);
//       setDocToDelete(null);
//     }
//   };

//   // Sort and paginate documents
//   const sortedDocuments = filteredDocs.sort((a, b) =>
//     sortOrder === 'newest'
//       ? b.title.localeCompare(a.title)
//       : a.title.localeCompare(b.title)
//   );
//   const indexOfLastDoc = currentPage * rowsPerPage;
//   const indexOfFirstDoc = indexOfLastDoc - rowsPerPage;
//   const paginatedDocuments = sortedDocuments.slice(indexOfFirstDoc, indexOfLastDoc);
//   const totalPages = Math.ceil(filteredDocs.length / rowsPerPage);

//   // Generate page numbers
//   const getPageNumbers = () => {
//     const pages: (number | string)[] = [];
//     if (totalPages <= 5) {
//       for (let i = 1; i <= totalPages; i++) pages.push(i);
//     } else {
//       pages.push(1);
//       if (currentPage > 3) pages.push('...');
//       const start = Math.max(2, currentPage - 1);
//       const end = Math.min(totalPages - 1, currentPage + 1);
//       for (let i = start; i <= end; i++) pages.push(i);
//       if (currentPage < totalPages - 2) pages.push('...');
//       pages.push(totalPages);
//     }
//     return pages;
//   };

//   // Render document item with proper layout
//   const renderDocumentList = ({ item }: { item: Document }) => (
//     <View
//       style={{
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         backgroundColor: colors.card || '#E0F2F1',
//         borderRadius: 8,
//         padding: 12,
//         marginVertical: 8,
//         elevation: 2,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.2,
//         shadowRadius: 1,
//       }}
//     >
//       <View style={{ flexDirection: 'column', flex: 1 }}>
//         <Image
//           source={isDark ? require('../../../assets/file_icon_dark.png') : require('../../../assets/file_icon_li8.png')}
//           style={{ width: 32, height: 32 }}
//         />
//         <View style={{ marginVertical: 10, flex: 1 }}>
//           <Text
//             style={{
//               color: colors.text || '#000000',
//               fontSize: 16,
//               fontWeight: 'bold',
//             }}
//             numberOfLines={1}
//             ellipsizeMode="tail"
//           >
//             {item.title}
//           </Text>
//           <View style={{
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',

//           }}>
//             <Text style={{ color: colors.text || '#000000', fontSize: 12, opacity: 0.5 }}>
//               Size: {item.size}
//             </Text>
//             <TouchableOpacity onPress={() => confirmDeleteDocument(item)}>
//               <Ionicons name="trash" size={16} color={colors.deleteIcon} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </View>
//   );

//   return (
//     <View style={{ flex: 1, backgroundColor: colors.background || '#FFFFFF' }}>
//       {loading && (
//         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//           <ActivityIndicator size="large" color={colors.primary || '#26A69A'} />
//         </View>
//       )}
//       {!loading && (
//         <>
//           {/* Search Bar */}
//           <View style={{ padding: 16 }}>
//             <View style={{ width: '100%', position: 'relative' }}>
//               <TextInput
//                 style={{
//                   backgroundColor: colors.searchbg || '#E0E0E0',
//                   borderRadius: 10,
//                   padding: 10,
//                   paddingLeft: 40,
//                   color: colors.text,
//                   elevation: 2,
//                   shadowColor: '#000',
//                   shadowOffset: { width: 0, height: 1 },
//                   shadowOpacity: 0.2,
//                   shadowRadius: 1,
//                   height: 40,
//                 }}
//                 placeholder="Search"
//                 placeholderTextColor={colors.searchPlaceholder}
//                 value={searchQuery}
//                 onChangeText={handleSearch}
//               />

//               <Ionicons
//                 name="search"
//                 size={18}
//                 color={colors.searchPlaceholder}
//                 style={{ position: 'absolute', left: 10, top: 12 }}
//               />
//             </View>
//           </View>

//           {/* Document List */}
//           <FlatList
//             data={paginatedDocuments}
//             renderItem={renderDocumentList}
//             keyExtractor={(item) => item.id}
//             contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
//           />

//           {/* Pagination */}
//           <View
//             className='flex w-full'
//             style={{
//               backgroundColor: colors.background || '#FFFFFF',
//               padding: 16,
//               elevation: 2,
//               shadowColor: '#000',
//               shadowOffset: { width: 0, height: 1 },
//               shadowOpacity: 0.2,
//               shadowRadius: 1,
//               flexDirection: 'column',
//             }}
//           >
//             {/* Rows per page selector - Similar to OrderTable.tsx */}
//             <View className="flex flex-row items-center mb-2" style={{ position: 'relative' }}>
//               <Text className="text-sm opacity-50 mr-2" style={{ color: colors.text }}>
//                 Rows per page
//               </Text>
//               <View style={{ position: 'relative' }}>
//                 <TouchableOpacity
//                   className="rounded px-1.5 py-1 flex flex-row items-center justify-between w-[50px]"
//                   style={{ backgroundColor: colors.searchbg }}
//                   onPress={() => setShowRowsDropdown(prev => !prev)}
//                 >
//                   <Text className="text-xs opacity-50" style={{ color: colors.text }}>
//                     {rowsPerPage}
//                   </Text>
//                   <Ionicons
//                     name="chevron-down"
//                     size={16}
//                     color={colors.text}
//                     style={{ opacity: 0.5 }}
//                   />
//                 </TouchableOpacity>
//                 {showRowsDropdown && (
//                   <View
//                     style={{
//                       position: 'absolute',
//                       bottom: 0,
//                       left: 0,
//                       backgroundColor: isDark ? '#343434' : '#FFFFFF',
//                       borderRadius: 8,
//                       padding: 8,
//                       width: 100,
//                       zIndex: 10,
//                       elevation: 5,
//                       shadowColor: '#000',
//                       shadowOffset: { width: 0, height: 2 },
//                       shadowOpacity: 0.25,
//                       shadowRadius: 3.84,
//                     }}
//                   >
//                     {[5, 10, 15].map(num => (
//                       <TouchableOpacity
//                         key={num}
//                         style={{
//                           paddingVertical: 8,
//                           paddingHorizontal: 12,
//                           borderBottomWidth: num !== 24 ? 1 : 0,
//                           borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
//                         }}
//                         onPress={() => {
//                           setRowsPerPage(num);
//                           setCurrentPage(1);
//                           setShowRowsDropdown(false);
//                         }}
//                       >
//                         <Text
//                           style={{
//                             color: colors.text,
//                             fontSize: 14,
//                             fontWeight: rowsPerPage === num ? 'bold' : 'normal',
//                           }}
//                         >
//                           {num}
//                         </Text>
//                       </TouchableOpacity>
//                     ))}
//                   </View>
//                 )}
//               </View>

//               {/* Current page indicator */}
//               <Text style={{ color: colors.text, marginLeft: 'auto' }}>
//                 Page {currentPage} of {totalPages}
//               </Text>
//             </View>

//             {/* prev next buttons - taking half width each */}
//             <View className='flex w-full' style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//               <TouchableOpacity
//                 onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
//                 disabled={currentPage === 1}
//                 style={{
//                   width: '48%',
//                   borderRadius: 12,
//                   overflow: 'hidden',
//                   height: 47,
//                 }}
//               >
//                 {currentPage === 1 ? (
//                   <LinearGradient
//                     colors={['#2F9A92', '#2C72FF']}
//                     locations={[0, 1]}
//                     start={{ x: 0.54, y: 0.41 }}
//                     end={{ x: 0.49, y: 1.5 }}
//                     style={{
//                       paddingVertical: 12,
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       height: 47,
//                       width: '100%',
//                       flexDirection: 'row',
//                       opacity: 0.3, // 30% opacity for disabled state
//                     }}
//                   >
//                     <Text style={{ color: 'white', fontWeight: '500' }}>
//                       Previous
//                     </Text>
//                   </LinearGradient>
//                 ) : (
//                   <LinearGradient
//                     colors={['#2F9A92', '#2C72FF']}
//                     locations={[0, 1]}
//                     start={{ x: 0.54, y: 0.41 }}
//                     end={{ x: 0.49, y: 1.5 }}
//                     style={{
//                       paddingVertical: 12,
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       height: 47,
//                       width: '100%',
//                       flexDirection: 'row',
//                     }}
//                   >
//                     <Text style={{ color: 'white', fontWeight: '500' }}>
//                       Previous
//                     </Text>
//                   </LinearGradient>
//                 )}
//               </TouchableOpacity>

//               <TouchableOpacity
//                 onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
//                 disabled={currentPage === totalPages || totalPages === 0}
//                 style={{
//                   width: '48%',
//                   borderRadius: 12,
//                   overflow: 'hidden',
//                   height: 47,
//                 }}
//               >
//                 {currentPage === totalPages || totalPages === 0 ? (
//                   <LinearGradient
//                     colors={['#2F9A92', '#2C72FF']}
//                     locations={[0, 1]}
//                     start={{ x: 0.54, y: 0.41 }}
//                     end={{ x: 0.49, y: 1.5 }}
//                     style={{
//                       paddingVertical: 12,
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       height: 47,
//                       width: '100%',
//                       flexDirection: 'row',
//                       opacity: 0.3, // 30% opacity for disabled state
//                     }}
//                   >
//                     <Text style={{ color: 'white', fontWeight: '500' }}>
//                       Next
//                     </Text>
//                   </LinearGradient>
//                 ) : (
//                   <LinearGradient
//                     colors={['#2F9A92', '#2C72FF']}
//                     locations={[0, 1]}
//                     start={{ x: 0.54, y: 0.41 }}
//                     end={{ x: 0.49, y: 1.5 }}
//                     style={{
//                       paddingVertical: 12,
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       height: 47,
//                       width: '100%',
//                       flexDirection: 'row',
//                     }}
//                   >
//                     <Text style={{ color: 'white', fontWeight: '500' }}>
//                       Next
//                     </Text>
//                   </LinearGradient>
//                 )}
//               </TouchableOpacity>

//             </View>

//           </View>

//           {/* Page numbers */}
//           <View className='flex w-full' style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 16, gap: 16 }}>
//             {getPageNumbers().map((page, index) => (
//               <TouchableOpacity
//                 key={index}
//                 onPress={() => typeof page === 'number' && setCurrentPage(page)}
//                 disabled={typeof page !== 'number'}
//                 style={{
//                   padding: 4,
//                   marginHorizontal: 2,
//                   backgroundColor:
//                     page === currentPage ? 'transparent' : colors.searchbg,
//                   borderRadius: 4,
//                   minWidth: 46,
//                   height: 28,
//                   alignItems: 'center',
//                 }}
//               >
//                 <Text
//                   style={{
//                     color: colors.text,
//                   }}
//                 >
//                   {page}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </>
//       )}

//       {/* Confirmation Modal for Delete */}
//       <ConfirmModal
//         isVisible={modalVisible}
//         onClose={() => {
//           setModalVisible(false);
//           setDocToDelete(null);
//         }}
//         onConfirm={handleDeleteDocument}
//         title="Confirm Delete"
//         message={`Deleting this document will erase the knowledge.\nAre you sure you want to delete "${docToDelete?.title || ''}"?`}
//       />
//     </View>
//   );
// };

// export default HomeScreen;
