import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  RefreshCcw,
  Search,
  Menu,
  FileSpreadsheet,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatInTimeZone } from 'date-fns-tz';
import * as XLSX from 'xlsx';
// import Loader from './Loader'; // Your Loader component
import { ActivityIndicator } from './nativewindui/ActivityIndicator';
import { useAdminLogStore } from '../state/adminLogStore'; // Adjust path
import type { Log } from '../state/adminLogStore'; // Adjust path
import { useAuth } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');
const isMobile = width < 1024;

type PageItem = number | '...';

function getPageItems(
  totalPages: number,
  currentPage: number,
  { siblingCount = 1 } = {}
): PageItem[] {
  if (totalPages <= 0) return [];

  const range = (s: number, e: number) =>
    Array.from({ length: Math.max(0, e - s + 1) }, (_, i) => s + i);

  const maxWithoutDots = 4;
  if (totalPages <= maxWithoutDots) return range(1, totalPages);

  const first = 1;
  const last = totalPages;

  const start = Math.max(first + 1, currentPage - siblingCount);
  const end = Math.min(last - 1, currentPage + siblingCount);

  const items: PageItem[] = [first];

  if (start > first + 1) items.push('...');
  items.push(...range(start, end));
  if (end < last - 1) items.push('...');

  if (last !== first) items.push(last);

  return items;
}

interface TableProps {
  toggleSideBar: () => void;
  isSideBarOpen: boolean;
}

const Logs: React.FC<TableProps> = ({ toggleSideBar, isSideBarOpen }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const columnOrder: Array<keyof Log> = ['id', 'timestamp', 'user_name', 'action', 'message'];
  const headers = useMemo(() => columnOrder, [columnOrder]);
  const itemsPerPage = 8;
  const [searchTerm, setSearchTerm] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { logs, fetchLogs, loading } = useAdminLogStore();
  const { getToken } = useAuth();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const getLogs = async () => {
    reSetDates();
    setSearchTerm('');
    await fetchLogs(getToken);
  };

  const reSetDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  useEffect(() => {
    getLogs();
  }, []);

  const exportToExcel = async () => {
    const exportData = logs
      .filter(
        (log) =>
          log?.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log?.action.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((log, index) => ({
        'S.No': index + 1,
        'Timestamp': formatInTimeZone(
          new Date(log.timestamp),
          'America/Chicago',
          'EEE, MMM dd yyyy HH:mm:ss'
        ) + ' CST',
        'Username': log.user_name,
        'Action': log.action,
        'Message': log.message,
      }));
const worksheet = (XLSX.utils as any).json_to_sheet(exportData);
 const workbook = (XLSX.utils as any).book_new();
(XLSX.utils as any).book_append_sheet(workbook, worksheet, 'Logs');

    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const fileUri = `${FileSystem.documentDirectory}Admin_Logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(fileUri);
  };

  const getTodayCST = () => {
    return formatInTimeZone(new Date(), 'America/Chicago', 'yyyy-MM-dd');
  };

  const toCST = (date: Date) => {
    return new Date(formatInTimeZone(date, 'America/Chicago', date.toISOString()));
  };

  const getLogsWithDates = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', "Please select both a 'From' and 'To' date.");
      return;
    }

    const startCST = toCST(startDate);
    const endCST = toCST(endDate);
    const todayCST = toCST(new Date());

    if (startCST > todayCST) {
      Alert.alert('Error', "The 'From' date cannot be in the future.");
      return;
    }
    if (endCST > todayCST) {
      Alert.alert('Error', "The 'To' date cannot be in the future.");
      return;
    }

    if (endCST < startCST) {
      Alert.alert('Error', "The 'To' date cannot be earlier than the 'From' date.");
      return;
    }

    const maxDays = 90;
    const diffDays = (endCST.getTime() - startCST.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > maxDays) {
      Alert.alert('Error', `Please select a date range of ${maxDays} days or less.`);
      return;
    }

    startCST.setHours(0, 0, 0, 0);
    endCST.setHours(23, 59, 59, 999);

    await fetchLogs(getToken, startCST, endCST);
  };

  const renderKeys = (key: string) => {
    switch (key) {
      case 'id':
        return 'S.No';
      case 'user_name':
        return 'Username';
      case 'action':
        return 'Action';
      case 'message':
        return 'Message';
      case 'timestamp':
        return 'Timestamp (CST)';
      default:
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const filteredCount = useMemo(
    () =>
      logs.filter(
        (l) =>
          l?.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l?.action.toLowerCase().includes(searchTerm.toLowerCase())
      ).length,
    [logs, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCount / itemsPerPage));

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const renderContent = (key: string, value: any, index: number) => {
    if (key === 'timestamp') {
      return formatInTimeZone(
        new Date(value),
        'America/Chicago',
        'EEE, MMM dd yyyy HH:mm:ss'
      );
    }
    if (key === 'id') {
      return startIndex + 1 + index;
    }
    return value;
  };

  const formatDateInput = (date?: Date | null) => {
    return date && !isNaN(date.getTime())
      ? formatInTimeZone(date, 'America/Chicago', 'yyyy-MM-dd')
      : '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  const filteredData = useMemo(() => {
    return logs
      .filter(
        (log) =>
          log?.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log?.action.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(startIndex, endIndex);
  }, [logs, searchTerm, startIndex, endIndex]);

  const renderRow = ({ item: log, index }: { item: Log; index: number }) => (
    <View style={styles.row}>
      {headers.map((header) => (
        <View
          key={String(header)}
          style={[
            styles.cell,
            {
              width:
                header === 'id'
                  ? '15%'
                  : header === 'timestamp'
                  ? '25%'
                  : header === 'user_name'
                  ? '20%'
                  : header === 'action'
                  ? '15%'
                  : '25%',
              minWidth: header === 'message' ? 200 : undefined,
            },
          ]}
        >
          <Text style={styles.cellText}>{renderContent(header, log[header], index)}</Text>
        </View>
      ))}
    </View>
  );

  const pageItems = getPageItems(totalPages, currentPage, { siblingCount: 1 });

  return (
    <View style={styles.container}>
      {/* Desktop Controls */}
      {!isMobile && (
        <View style={styles.desktopControls}>
          <TouchableOpacity onPress={toggleSideBar} style={styles.menuButton}>
            <Menu size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.controlRow}>
            <View style={styles.searchContainer}>
              <Search size={20} color="gray" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search with username or action"
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="gray"
              />
            </View>
            <View style={styles.dateControls}>
              <Text style={styles.dateLabel}>From:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDateInput(startDate)}</Text>
              </TouchableOpacity>
              <Text style={styles.dateLabel}>To:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDateInput(endDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={getLogsWithDates}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={exportToExcel}>
                <FileSpreadsheet size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={getLogs}>
                <RefreshCcw size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Mobile Controls */}
      {isMobile && (
        <View style={styles.mobileControls}>
          <View style={styles.mobileTopRow}>
            <TouchableOpacity onPress={toggleSideBar} style={styles.menuButton}>
              <Menu size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.searchContainer}>
              <Search size={20} color="gray" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search username or action"
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="gray"
              />
            </View>
            <View style={styles.mobileIcons}>
              <TouchableOpacity style={styles.iconButton} onPress={exportToExcel}>
                <FileSpreadsheet size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={getLogs}>
                <RefreshCcw size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.mobileDateRow}>
            <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>From:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDateInput(startDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>To:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDateInput(endDate)}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={getLogsWithDates}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          minimumDate={startDate || new Date(2020, 0, 1)}
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}

      {/* Table Header */}
      <View style={styles.tableHeader}>
        {headers.map((header) => (
          <View
            key={String(header)}
            style={[
              styles.headerCell,
              {
                width:
                  header === 'id'
                    ? '15%'
                    : header === 'timestamp'
                    ? '25%'
                    : header === 'user_name'
                    ? '20%'
                    : header === 'action'
                    ? '15%'
                    : '25%',
              },
            ]}
          >
            <Text style={styles.headerText}>{renderKeys(header)}</Text>
          </View>
        ))}
      </View>

      {/* Table Body */}
      <FlatList
        data={filteredData}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderRow}
        style={styles.tableBody}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data found.</Text>
          </View>
        }
        scrollEnabled={true}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCount)} of {filteredCount} results
            </Text>
          </View>
          <View style={styles.paginationNav}>
            <TouchableOpacity
              onPress={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
            >
              <Text style={styles.pageIcon}>Previous</Text>
            </TouchableOpacity>
            {pageItems.map((it, idx) =>
              it === '...' ? (
                <View key={`dots-${idx}`} style={styles.dots}>
                  <Text style={styles.dotsText}>…</Text>
                </View>
              ) : (
                <TouchableOpacity
                  key={it}
                  onPress={() => setCurrentPage(it)}
                  style={[
                    styles.pageButton,
                    currentPage === it && styles.activePageButton,
                  ]}
                >
                  <Text style={styles.pageText}>{it}</Text>
                </TouchableOpacity>
              )
            )}
            <TouchableOpacity
              onPress={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
            >
              <Text style={styles.pageIcon}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: 'var(--screen-background)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuButton: {
    padding: 4,
  },
  controlRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
    flex: 0.3,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    color: 'white',
    fontSize: 14,
  },
  dateButton: {
    backgroundColor: 'var(--primary-gradient)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dateText: {
    color: 'white',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: 'var(--primary-gradient)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  submitText: {
    color: 'white',
    fontSize: 14,
  },
  iconButton: {
    padding: 4,
    borderRadius: 4,
  },
  mobileControls: {
    gap: 8,
    marginBottom: 12,
  },
  mobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  mobileDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    backgroundColor: '#232323',
  },
  headerCell: {
    paddingHorizontal: 8,
    justifyContent: 'flex-start',
  },
  headerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableBody: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    alignItems: 'center',
  },
  cell: {
    paddingHorizontal: 8,
    flex: 1,
  },
  cellText: {
    color: 'white',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    color: 'gray',
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#232323',
    borderRadius: 8,
  },
  paginationInfo: {
    flex: 1,
  },
  paginationText: {
    color: 'white',
    fontSize: 14,
  },
  paginationNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'gray',
    borderRadius: 4,
    marginHorizontal: 2,
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
  pageIcon: {
    color: 'white',
    fontSize: 14,
  },
  dots: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dotsText: {
    color: 'white',
    fontSize: 14,
  },
});

export default Logs;