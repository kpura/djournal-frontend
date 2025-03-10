import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Svg, Circle } from 'react-native-svg';
import { fetchUserHistory } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataVisualization = () => {
  const navigation = useNavigation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [markedDates, setMarkedDates] = useState({});
  const [entryCounts, setEntryCounts] = useState([]);
  const [moodData, setMoodData] = useState({
    positive: 0,
    negative: 0,
    neutral: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState(null);

  useEffect(() => {
    fetchVisualizationData();
  }, [selectedMonth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVisualizationData();
    setRefreshing(false);
  };

  const fetchVisualizationData = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      
      setError(null);
      
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
      const year = selectedMonth.getFullYear();
      
      console.log('Fetching data with params:', { userId, month, year });
      
      const data = await fetchUserHistory(month, year);
      setHistoryData(data);
      
      processHistoryData(data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching visualization data:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        setError(`${err.response.status}: ${err.response.data.message || 'Server error'}`);
      } else {
        setError(err.message || 'Failed to fetch data');
      }
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processHistoryData = (data) => {
    if (!data || !data.entries || data.entries.length === 0) {
      setMarkedDates({});
      setEntryCounts([]);
      setMoodData({
        positive: 0,
        negative: 0,
        neutral: 0
      });
      return;
    }
    
    const dates = {};
    const entriesPerDay = {};
    
    data.entries.forEach(entry => {
      const entryDate = entry.entry_datetime.split(' ')[0];
      
      let sentiment = entry.sentiment || 'neutral';
      
      if (!sentiment || sentiment === '') {
        if (entry.positive_percentage > entry.negative_percentage && 
            entry.positive_percentage > entry.neutral_percentage) {
          sentiment = 'positive';
        } else if (entry.negative_percentage > entry.positive_percentage && 
                  entry.negative_percentage > entry.neutral_percentage) {
          sentiment = 'negative';
        } else {
          sentiment = 'neutral';
        }
      }
      
      if (!entriesPerDay[entryDate]) {
        entriesPerDay[entryDate] = 1;
      } else {
        entriesPerDay[entryDate]++;
      }
      
      if (!dates[entryDate] || 
          (sentiment === 'positive' && dates[entryDate].sentiment !== 'positive') ||
          (sentiment === 'negative' && dates[entryDate].sentiment === 'neutral')) {
        dates[entryDate] = {
          marked: true,
          sentiment: sentiment
        };
      }
    });
    
    if (data.summary && data.summary.averageMood) {
      setMoodData({
        positive: data.summary.averageMood.positive || 0,
        negative: data.summary.averageMood.negative || 0,
        neutral: data.summary.averageMood.neutral || 0
      });
    }
    
    setEntryCounts(Object.entries(entriesPerDay).map(([date, count]) => ({ date, count })));
    
    setMarkedDates(dates);
  };

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = selectedMonth.getMonth();
    const currentYear = selectedMonth.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    
    let calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = today.getDate() === i && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
      const hasEntry = markedDates[dateString];
      
      let dotColor = 'transparent';
      if (hasEntry) {
        if (hasEntry.sentiment === 'positive') {
          dotColor = '#4CAF50';
        } else if (hasEntry.sentiment === 'negative') {
          dotColor = '#F44336';
        } else {
          dotColor = '#64B5F6';
        }
      }
      
      calendarDays.push(
        <View key={i} style={[styles.calendarDay, isToday ? styles.calendarToday : null]}>
          <Text style={[styles.calendarDayText, isToday ? styles.calendarTodayText : null]}>{i}</Text>
          {hasEntry && (
            <View style={[styles.calendarDot, { backgroundColor: dotColor }]} />
          )}
        </View>
      );
    }
    
    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => {
            const newDate = new Date(currentYear, currentMonth - 1, 1);
            setSelectedMonth(newDate);
          }}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>{monthNames[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={() => {
            const newDate = new Date(currentYear, currentMonth + 1, 1);
            setSelectedMonth(newDate);
          }}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarWeekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.calendarDaysContainer}>
          {calendarDays}
        </View>
      </View>
    );
  };
  
  const renderPieChart = () => {
    const total = moodData.positive + moodData.negative + moodData.neutral;
    if (total === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No mood data available for this month</Text>
        </View>
      );
    }
    
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    const positiveSize = Math.max((moodData.positive / total) * radius, 10);
    const negativeSize = Math.max((moodData.negative / total) * radius, 10);
    const neutralSize = Math.max((moodData.neutral / total) * radius, 10);
    
    return (
      <View style={styles.pieChartContainer}>
        <Svg height="200" width="200">
          <Circle cx={centerX} cy={centerY} r={positiveSize} fill="#4CAF50" />
          <Circle cx={centerX + 30} cy={centerY - 20} r={negativeSize} fill="#F44336" />
          <Circle cx={centerX - 30} cy={centerY + 10} r={neutralSize} fill="#64B5F6" />
        </Svg>
        <View style={styles.pieStatsContainer}>
          <View style={styles.moodLegendItem}>
            <View style={[styles.moodLegendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.moodLegendText}>Joyful: {total > 0 ? Math.round((moodData.positive / total) * 100) : 0}%</Text>
          </View>
          <View style={styles.moodLegendItem}>
            <View style={[styles.moodLegendColor, { backgroundColor: '#F44336' }]} />
            <Text style={styles.moodLegendText}>Uncertain: {total > 0 ? Math.round((moodData.negative / total) * 100) : 0}%</Text>
          </View>
          <View style={styles.moodLegendItem}>
            <View style={[styles.moodLegendColor, { backgroundColor: '#64B5F6' }]} />
            <Text style={styles.moodLegendText}>Content: {total > 0 ? Math.round((moodData.neutral / total) * 100) : 0}%</Text>
          </View>
        </View>
      </View>
    );
  };

  const generateInsights = () => {
    if (!historyData || !historyData.entries || historyData.entries.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available to generate insights</Text>
        </View>
      );
    }
    
    const insights = [];
    const totalEntries = historyData.entries.length;
    
    const { positive, negative, neutral } = moodData;
    let dominantMood = "content";
    let dominantPercentage = neutral;
    const total = positive + negative + neutral;
    
    if (positive > negative && positive > neutral) {
      dominantMood = "joyful";
      dominantPercentage = positive;
    } else if (negative > positive && negative > neutral) {
      dominantMood = "uncertain";
      dominantPercentage = negative;
    }
    
    if (total > 0) {
      insights.push({
        icon: dominantMood === "joyful" ? "emoticon-happy" : 
              dominantMood === "uncertain" ? "emoticon-sad" : "emoticon-neutral",
        iconColor: dominantMood === "joyful" ? "#4CAF50" : 
                  dominantMood === "uncertain" ? "#F44336" : "#64B5F6",
        title: `Dominant Mood: ${dominantMood.charAt(0).toUpperCase() + dominantMood.slice(1)}`,
        text: `Your entries this month reflect a predominantly ${dominantMood} mood (${Math.round((dominantPercentage / total) * 100)}%).`
      });
    }
    
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
    historyData.entries.forEach(entry => {
      if (entry.entry_datetime) {
        try {
          const entryDate = new Date(entry.entry_datetime);
          if (!isNaN(entryDate.getTime())) {
            dayOfWeekCounts[entryDate.getDay()]++;
          }
        } catch (err) {
          console.error('Error parsing date:', err);
        }
      }
    });
    
    const maxDayCount = Math.max(...dayOfWeekCounts);
    const mostActiveDay = dayOfWeekCounts.indexOf(maxDayCount);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    if (maxDayCount > 1 && totalEntries > 0) {
      insights.push({
        icon: "calendar-clock",
        iconColor: "#FF9800",
        title: "Most Active Day",
        text: `You tend to journal most on ${dayNames[mostActiveDay]}s (${Math.round((maxDayCount / totalEntries) * 100)}% of entries).`
      });
    }

    if (totalEntries >= 5) {
      const consistentDays = Object.keys(entryCounts).length;
      const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
      const consistencyPercentage = Math.round((consistentDays / daysInMonth) * 100);
      
      let consistencyMessage;
      let consistencyIcon;
      let consistencyColor;
      
      if (consistencyPercentage >= 80) {
        consistencyMessage = "Excellent consistency! You've journaled most days this month.";
        consistencyIcon = "check-circle";
        consistencyColor = "#4CAF50";
      } else if (consistencyPercentage >= 50) {
        consistencyMessage = "Good consistency. You've journaled on many days this month.";
        consistencyIcon = "check-circle-outline";
        consistencyColor = "#8BC34A";
      } else if (consistencyPercentage >= 20) {
        consistencyMessage = "You're building a journaling habit. Keep it up!";
        consistencyIcon = "progress-check";
        consistencyColor = "#FF9800";
      } else {
        consistencyMessage = "Try to journal more frequently for better insights.";
        consistencyIcon = "progress-clock";
        consistencyColor = "#9E9E9E";
      }
      
      insights.push({
        icon: consistencyIcon,
        iconColor: consistencyColor,
        title: "Journaling Consistency",
        text: consistencyMessage
      });
    }
    
    if (insights.length === 0) {
      insights.push({
        icon: "information-outline",
        iconColor: "#2196F3",
        title: "Keep Journaling",
        text: "Continue journaling to generate more personalized insights."
      });
    }
    
    return (
      <>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightRow}>
            <MaterialCommunityIcons name={insight.icon} size={24} color={insight.iconColor} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          </View>
        ))}
      </>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>Data Visualization</Text>
        <View style={styles.loadingContainer}>
          <Text>Loading visualization data...</Text>
          <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 10 }} />
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>Data Visualization</Text>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={40} color="#F44336" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchVisualizationData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <FontAwesome5 name="arrow-left" size={20} color="#333" />
      </TouchableOpacity>

      <Text style={styles.header}>Data Visualization</Text>

      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2196F3"]}
            tintColor="#2196F3"
          />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-month" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Calendar View</Text>
          </View>
          <Text style={styles.subtitle}>Journal entries by day</Text>
          {renderCalendar()}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Joyful</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Uncertain</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#64B5F6' }]} />
              <Text style={styles.legendText}>Content</Text>
            </View>
          </View>
        </View>
        
        {/* Mood Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="chart-pie" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Overall Mood</Text>
          </View>
          <Text style={styles.subtitle}>Your emotional patterns this month</Text>
          {renderPieChart()}
        </View>
        
        {/* Entry Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="chart-line" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Entry Statistics</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{entryCounts.length}</Text>
              <Text style={styles.statLabel}>Days with Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {historyData && historyData.summary ? historyData.summary.totalEntries : 0}
              </Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {entryCounts.length > 0 
                  ? ((historyData && historyData.summary ? historyData.summary.totalEntries : 0) / entryCounts.length).toFixed(1) 
                  : '0'}
              </Text>
              <Text style={styles.statLabel}>Avg Per Day</Text>
            </View>
          </View>
        </View>
        
        {/* Additional Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Insights</Text>
          </View>
          <Text style={styles.subtitle}>Trends and patterns in your journal</Text>
          {generateInsights()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    position: 'absolute',
    left: 18,
    top: 10,
    marginTop: 50,
  },
  header: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 57,
    marginBottom: 10,
    left: 55,
  },
  scrollViewContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginLeft: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  calendarContainer: {
    marginTop: 5,
    marginBottom: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarWeekDay: {
    fontSize: 12,
    color: '#666',
    width: 36,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  calendarToday: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 20,
  },
  calendarTodayText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  calendarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  pieStatsContainer: {
    marginTop: 10,
  },
  moodLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodLegendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  moodLegendText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  insightContent: {
    marginLeft: 10,
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
});

export default DataVisualization;