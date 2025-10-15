import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import { Chat, Message } from '../utils/utils';
import { LinearGradient } from 'expo-linear-gradient';
import { n } from 'framer-motion/dist/types.d-B50aGbjN';

// Column names mapping (similar to your web version)
const column_names: Record<string, string> = {
  reqnum: 'Request Number',
  ordlin: 'Order Line',
  effpri: 'Effective Priority',
  // Add other column mappings as needed
};

interface OrderTableProps {
  msg: Message;
  chat: Chat | null;
}

const OrderTable: React.FC<OrderTableProps> = ({ msg, chat }) => {
  const { colors } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);

  // Parse the JSON data
  let parsedData;
  let previous_version: { [x: string]: any; }[];

  // console.log("orderline_json type:", typeof msg.orderline_json);
  // console.log("orderline_json value:", msg.orderline_json);


  if (!msg.orderline_json) {
    return <Text style={{ color: colors.text }}>No order data available</Text>;
  }
  //   try {
  //     if (msg.orderline_json && Array.isArray(msg.orderline_json)) {
  //       parsedData = msg.orderline_json;
  //       previous_version = msg.previous_json;
  //     } else if (typeof msg.orderline_json === 'string') {
  //       // Log the problematic string for debugging
  //       console.log("Attempting to parse:", msg.orderline_json.substring(0, 50) + "...");
  //       parsedData = JSON.parse(msg.orderline_json);
  //       previous_version = msg.previous_json && typeof msg.previous_json === 'string' 
  //         ? JSON.parse(msg.previous_json) 
  //         : msg.previous_json;
  //     } else {
  //       // Handle case where orderline_json is neither an array nor a string
  //       console.log("Invalid orderline_json type:", typeof msg.orderline_json);
  //       parsedData = [];
  //       previous_version = [];
  //     }
  //   } catch (error) {
  //     console.error("Invalid JSON:", error, "Data:", msg.orderline_json);
  //     return <Text style={{ color: colors.text }}>Message from Server: Unable to parse data</Text>;
  //   }


  // if (!Array.isArray(parsedData) || (previous_version && !Array.isArray(previous_version))) {
  //   return <Text style={{ color: colors.text }}>Invalid data format</Text>;
  // }

  try {
    if (msg.orderline_json && Array.isArray(msg.orderline_json)) {
      parsedData = msg.orderline_json;
      previous_version = msg.previous_json
    } else {
      try{
        parsedData = msg.orderline_json && JSON.parse(msg.orderline_json);
      } catch (error) {
        return <Text style={ { color : colors.text}}>Message from Server: {msg.orderline_json}</Text>;
      }
      previous_version = msg.previous_json && JSON.parse(msg.previous_json)
    }
  } catch (error) {
    return <Text style={ { color : colors.text}}>Message from Server: {msg.orderline_json}</Text>;
  }

  if (!Array.isArray(parsedData) || (previous_version && !Array.isArray(previous_version))) {
    return <Text style={ { color : colors.text}}>Invalid data format</Text>;
  }


  const headers = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  // Filter data based on search term
  const filteredData = parsedData.filter(item =>
    headers.some(header =>
      item[header]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Handle row click
  const handleRowPress = (item: any) => {
    console.log(item);
    console.log(chat);
  };

  // Pagination controls
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

 // Render pagination buttons
const renderPaginationButtons = () => {
  const buttons = [];
  const maxVisibleButtons = 5; // Increased for better visibility

  // First page
  buttons.push(
    <TouchableOpacity
      key={1}
      onPress={() => goToPage(1)}
      style={{
        width: 45,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        marginHorizontal: 2,
        overflow: 'hidden', // Clips gradient to border radius
      }}
    >
      {currentPage === 1 ? (
        <LinearGradient
          colors={['#2F9A92', '#2C72FF']}
          locations={[0, 1]}
          start={{ x: 0.54, y: 0.41 }}
          end={{ x: 0.49, y: 1.5 }}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <Text style={{ color: 'white' }}>1</Text>
        </LinearGradient>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.searchbg,
            width: '100%',
            height: '100%',
          }}
        >
          <Text style={{ color: colors.text }}>1</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Calculate the range of pages to display
  let startPage = Math.max(2, currentPage - Math.floor((maxVisibleButtons - 2) / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxVisibleButtons - 3);
  
  // Adjust startPage if endPage is at its maximum
  if (endPage === totalPages - 1) {
    startPage = Math.max(2, endPage - (maxVisibleButtons - 3));
  }

  if (startPage > 2) {
    buttons.push(
      <Text key="ellipsis1" style={{ color: colors.text, opacity: 0.5 }}>...</Text>
    );
  }

  for (let i = startPage; i <= endPage; i++) {
    buttons.push(
      <TouchableOpacity
        key={i}
        onPress={() => goToPage(i)}
        style={{
          width: 45,
          height: 28,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 4,
          marginHorizontal: 2,
          overflow: 'hidden',
        }}
      >
        {currentPage === i ? (
          <LinearGradient
            colors={['#2F9A92', '#2C72FF']}
            locations={[0, 1]}
            start={{ x: 0.54, y: 0.41 }}
            end={{ x: 0.49, y: 1.5 }}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Text style={{ color: 'white' }}>{i}</Text>
          </LinearGradient>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.searchbg,
              width: '100%',
              height: '100%',
            }}
          >
            <Text style={{ color: colors.text }}>{i}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (endPage < totalPages - 1) {
    buttons.push(
      <Text key="ellipsis2" style={{ color: colors.text, opacity: 0.5 }}>...</Text>
    );
  }

  // Last page
  if (totalPages > 1) {
    buttons.push(
      <TouchableOpacity
        key={totalPages}
        onPress={() => goToPage(totalPages)}
        style={{
          width: 45,
          height: 28,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 4,
          marginHorizontal: 2,
          overflow: 'hidden',
        }}
      >
        {currentPage === totalPages ? (
          <LinearGradient
            colors={['#2F9A92', '#2C72FF']}
            locations={[0, 1]}
            start={{ x: 0.54, y: 0.41 }}
            end={{ x: 0.49, y: 1.5 }}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Text style={{ color: 'white' }}>{totalPages}</Text>
          </LinearGradient>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.searchbg,
              width: '100%',
              height: '100%',
            }}
          >
            <Text style={{ color: colors.text }}>{totalPages}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return buttons;
};


  // Render table header
  const renderTableHeader = () => (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.questionbg,
      borderBottomWidth: 1,
      borderBottomColor: colors.tableBorder,
      paddingVertical: 10,
    }}>
      <Text style={{
        width: 80,
        color: colors.text,
        opacity: 0.7,
        paddingHorizontal: 8,
        fontSize: 14,
      }}>
        Sr No
      </Text>
      {headers.map(header => (
        <Text
          key={header}
          style={{
            flex: 1,
            color: colors.text,
            opacity: 0.7,
            paddingHorizontal: 8,
            fontSize: 14,
            minWidth: 100,
          }}
        >
          {column_names[header] || header}
        </Text>
      ))}
    </View>
  );

  // Render table row
  const renderTableRow = ({ item, index }: { item: any, index: number }) => {
    // Check if row has changed compared to previous version
    const hasChanged = previous_version &&
      previous_version[index + indexOfFirstRow] &&
      headers.some(header => item[header] !== previous_version[index + indexOfFirstRow][header]);

    return (
      <TouchableOpacity
        onPress={() => handleRowPress(item)}
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: colors.tableBorder,
          backgroundColor: hasChanged ? colors.primary : 'transparent',
          
          paddingVertical: 10,
        }}
      >
        <Text style={{
          width: 80,
          color: '#888888',
          opacity: 0.7,
          paddingHorizontal: 8,
          fontSize: 14,
        }}>
          {index + 1 + indexOfFirstRow}
        </Text>
        {headers.map(header => (
          <Text
            key={header}
            style={{
              flex: 1,
              color: colors.text,
              paddingHorizontal: 8,
              fontSize: 14,
              minWidth: 100,
            }}
          >
            {item[header]}
          </Text>
        ))}
      </TouchableOpacity>
    );
  };

  // Calculate the actual width needed for the table
  const tableWidth = headers.length * 100 + 80; // 50 for Sr No column + 100 for each header

  return (
    <View
      className="flex-1 py-4 w-full"
      style={{
        borderWidth: 1,
        borderColor: colors.tableBorder,
        padding: 8,
        borderRadius: 12,
      }}
    >
      {/* Table Header with Search */}

      <View className="mb-[20px]">
        <View
          className="flex-row items-center justify-center rounded-lg px-3 w-40 h-[40px]"
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
            onChangeText={setSearchTerm}
            style={{
              color: colors.text,
              height: 40, // Match the container height
              textAlignVertical: 'center', // Center text vertically
              paddingVertical: 0, // Remove default padding
            }}
          />
        </View>
      </View>

      {/* <View className="flex flex-row justify-end items-center mb-3">
        <View
          className="flex flex-row items-center rounded-[10px] px-2 py-2 w-1/2 h-[32px]"
          style={{ backgroundColor: colors.searchbg }}
        >
          <Ionicons name="search" size={16} color="#7E7E7E" />
          <TextInput
            placeholder="Search"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="border-none text-xs focus:outline-none w-full"
            style={{ color: colors.text }}
            placeholderTextColor="#E0E0E0" // Use a light color for visibility
          />
          <TextInput
            placeholder="Search"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="bg-transparent border-none text-xs focus:outline-none w-full"
            style={{ color: colors.text }}
            placeholderTextColor='#7E7E7E'
            // placeholderTextColor={colors.searchPlaceholder || 'rgba(255, 255, 255, 0.5)'} // Fallback for visibility
          /> 
        </View>
      </View> */}

      {/* Table */}
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.tableBorder,
          borderRadius: 16,
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
        {filteredData.length > 0 ? (
          <ScrollView horizontal>
            <View style={{ width: Math.max(tableWidth, 300) }}>
              {renderTableHeader()}
              <FlatList
                data={currentRows}
                renderItem={renderTableRow}
                keyExtractor={(_, index) => index.toString()}
                scrollEnabled={false}
              />
            </View>
          </ScrollView>
        ) : (
          <View className="p-4">
            <Text style={{ color: colors.text }}>No data found</Text>
          </View>
        )}
      </View>

      {/* Pagination Controls */}
      <View className="flex flex-col mt-3">
        {/* Rows per page selector */}
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
                  top: 40, // Adjust based on button height
                  left: 0,
                  backgroundColor: '#343434',
                  borderRadius: 8,
                  padding: 8,
                  width: 100,
                  zIndex: 10,
                }}
              >
                {[5, 10, 15, 20].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderBottomWidth: num !== 20 ? 1 : 0,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                    onPress={() => {
                      setRowsPerPage(num);
                      setCurrentPage(1);
                      setShowRowsDropdown(false);
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
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
        </View>

        {/* Pagination buttons */}
        <View className="flex flex-row items-center">
          <TouchableOpacity
            onPress={goToPreviousPage}
            disabled={currentPage === 1}
            className="flex justify-center items-center w-6 h-6 rounded opacity-50 disabled:opacity-30"
            style={{ backgroundColor: colors.searchbg }}
          >
            <Ionicons name="chevron-back" size={16} color={colors.text} />
          </TouchableOpacity>

          <View className="flex flex-row items-center mx-2">
            {renderPaginationButtons()}
          </View>

          <TouchableOpacity
            onPress={goToNextPage}
            disabled={currentPage === totalPages}
            className="flex justify-center items-center w-6 h-6 rounded opacity-50 disabled:opacity-30"
            style={{ backgroundColor: colors.searchbg }}
          >
            <Ionicons name="chevron-forward" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default OrderTable;