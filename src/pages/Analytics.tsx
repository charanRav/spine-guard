import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StreakTracker } from '@/components/Analytics/StreakTracker';
import { PostureHeatmap } from '@/components/Analytics/PostureHeatmap';
import { ComparisonChart } from '@/components/Analytics/ComparisonChart';
import { DailyReport } from '@/components/Analytics/DailyReport';
import { WeeklyReport } from '@/components/Analytics/WeeklyReport';
import { getHistoricalData, getDateRange, getDailyData } from '@/utils/analyticsStorage';
import { exportToPDF, generateReportData } from '@/utils/pdfExport';
import { ArrowLeft, Download, CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [historicalData, setHistoricalData] = useState(getHistoricalData());
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  useEffect(() => {
    // Refresh data when component mounts
    setHistoricalData(getHistoricalData());
  }, []);

  const weeklyData = getDateRange(7);
  const today = new Date().toISOString().split('T')[0];
  const todayData = getDailyData(today);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const yesterdayData = getDailyData(yesterday);

  const handleExportPDF = async () => {
    try {
      const startDate = dateRange.from
        ? format(dateRange.from, 'yyyy-MM-dd')
        : format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const endDate = dateRange.to
        ? format(dateRange.to, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');

      await exportToPDF('analytics-export', `posture-report-${startDate}-to-${endDate}.pdf`);
      
      toast({
        title: 'Success',
        description: 'Your posture report has been downloaded!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report',
        variant: 'destructive',
      });
    }
  };

  const customRangeData = (() => {
    if (!dateRange.from || !dateRange.to) return weeklyData;
    
    const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const result = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.from);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const data = getDailyData(dateStr);
      if (data) result.push(data);
    }
    
    return result;
  })();

  const reportData = generateReportData(
    customRangeData,
    dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'N/A',
    dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'N/A'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Analytics & Insights
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track your posture journey and progress
                </p>
              </div>
            </div>
            <Button onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div id="analytics-export" className="space-y-8">
          {/* Streak Tracker */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Your Streaks</h2>
            <StreakTracker streakData={historicalData.streakData} />
          </section>

          {/* Tabs for Different Views */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="custom">Custom Range</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <WeeklyReport data={weeklyData} />
              
              <div className="grid gap-6 lg:grid-cols-2">
                <PostureHeatmap dailyData={weeklyData} />
                <ComparisonChart
                  data={weeklyData}
                  title="7-Day Comparison"
                  description="Your posture distribution over the last week"
                />
              </div>
            </TabsContent>

            {/* Daily Tab */}
            <TabsContent value="daily" className="space-y-6 mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {todayData && todayData.totalSessions > 0 && (
                  <DailyReport data={todayData} />
                )}
                
                {yesterdayData && yesterdayData.totalSessions > 0 && (
                  <DailyReport data={yesterdayData} />
                )}

                {(!todayData || todayData.totalSessions === 0) &&
                  (!yesterdayData || yesterdayData.totalSessions === 0) && (
                    <Card className="lg:col-span-2">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground text-center">
                          No session data available for recent days.<br />
                          Start a monitoring session to see your daily reports!
                        </p>
                      </CardContent>
                    </Card>
                  )}
              </div>

              {todayData && yesterdayData && todayData.totalSessions > 0 && yesterdayData.totalSessions > 0 && (
                <ComparisonChart
                  data={[yesterdayData, todayData]}
                  title="Today vs Yesterday"
                  description="Compare your posture between yesterday and today"
                />
              )}
            </TabsContent>

            {/* Custom Range Tab */}
            <TabsContent value="custom" className="space-y-6 mt-6">
              {/* Date Range Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Date Range</CardTitle>
                  <CardDescription>
                    Choose a custom date range for your report
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-[240px] justify-start text-left font-normal')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, 'PPP') : 'Pick start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>

                    <span className="text-muted-foreground">to</span>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-[240px] justify-start text-left font-normal')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, 'PPP') : 'Pick end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                          disabled={(date) => date > new Date() || (dateRange.from ? date < dateRange.from : false)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-muted-foreground">Period</div>
                      <div className="text-lg font-semibold">{reportData.period}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Sessions</div>
                      <div className="text-lg font-semibold">{reportData.totalSessions}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Time</div>
                      <div className="text-lg font-semibold">{reportData.totalHours}h</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Score</div>
                      <div className="text-lg font-semibold">{reportData.averageScore}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts for Custom Range */}
              {customRangeData.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <PostureHeatmap dailyData={customRangeData} />
                  <ComparisonChart
                    data={customRangeData}
                    title="Custom Range Analysis"
                    description="Posture distribution for selected period"
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">
                      No data available for the selected date range
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
