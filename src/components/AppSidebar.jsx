import { useMemo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { LayoutDashboard, BookOpen, CalendarDays, Timer, BarChart3, GraduationCap, Quote } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Dersler', url: '/courses', icon: BookOpen },
  { title: 'Planlama', url: '/planner', icon: CalendarDays },
  { title: 'Zamanlayıcı', url: '/timer', icon: Timer },
  { title: 'İstatistikler', url: '/stats', icon: BarChart3 },
];

const DAILY_QUOTES = [
  "Eğitim, dünyayı değiştirmek için kullanabileceğiniz en güçlü silahtır. - Nelson Mandela",
  "Hiçbir makul sebep olmadan çalışmak delilik olsa da, çalışmadan deha olmak imkansızdır. - Leonardo da Vinci",
  "Başarı tesadüf değildir. Çok çalışma, azim, öğrenme, araştırma, fedakarlık ve en önemlisi yaptığın işi sevmektir. - Pelé",
  "Zaman beklemez. Dün tarihtir. Yarın bir gizemdir. Bugün ise bir hediyedir. - Eleanor Roosevelt",
  "Bilgi cesaret verir, cehalet küstahlık. - Terry Brooks",
  "Asla her şeyi bildiğini sanma. Gerçekten çok bilgili olsan da, kendine 'ben cahilim' diyebilecek cesaretin olsun. - Ivan Pavlov",
  "Her şeyin mühim noktası, başlangıçtır. - Platon",
  "Zorluklar, başarının değerini anladığımız yerdir. - Epiktetos",
  "Bir insanın zekası verdiği cevaplardan değil, sorduğu sorulardan anlaşılır. - Albert Einstein",
  "Küçük adımlar, büyük hedeflere ulaşmanın tek yoludur. - Lao Tzu",
  "Hayal edebiliyorsanız, yapabilirsiniz. - Walt Disney",
  "Bana anlatırsan unuturum, öğretirsen hatırlarım, beni dahil edersen öğrenirim. - Benjamin Franklin",
  "En iyi şekilde hazırlanmak, başarmak için en güvenilir yoldur. - Arthur Ashe",
  "Rüzgarın yönünü değiştiremem ama yelkenlerimi daima hedefime ulaşacak şekilde ayarlayabilirim. - Jimmy Dean",
  "Başarı, küçük çabaların her gün tekrarlanmasıdır. - Robert Collier",
  "Sıradan biri ile dahi arasındaki fark, dahi kişinin bir kez daha denemesidir. - Albert Einstein",
  "Bekleyenlere bir şeyler ulaşabilir, ancak bunlar sadece acele edenlerin bıraktıklarıdır. - Abraham Lincoln",
  "Nereye gittiğinizi bilmiyorsanız, hangi yoldan gittiğinizin hiçbir önemi yoktur. - Lewis Carroll",
  "Başlamanın sırrı, parçalara ayırmaktan geçer. Karmaşık işleri çözülebilir küçük işlere böl ve ilkine başla. - Mark Twain",
  "Öğrenmek akıntıya karşı yüzmek gibidir; ilerlemeyen geriler. - Çin Atasözü",
  "Dünden öğrenin, bugünü yaşayın, yarın için umut edin. Önemli olan soru sormayı bırakmamaktır. - Albert Einstein",
  "Hayat, bisiklete binmek gibidir. Dengenizi korumak için hareket etmeye devam etmelisiniz. - Albert Einstein",
  "Şimdi çalış, sonra ağla. - Japon Atasözü",
  "Zorluğun ortasında fırsat yatar. - Albert Einstein",
  "Başarısızlık, daha zekice başlama fırsatıdır. - Henry Ford",
  "Eğer her şeyi kontrol altına aldığını hissediyorsan, yeterince hızlı gitmiyorsun demektir. - Mario Andretti",
  "Kaptanın ustalığı deniz durgunken anlaşılmaz. - Lukianos",
  "Bugün yap ya da yarın pişman ol. - Anonim",
  "Kendini fethedebilen kişi, en güçlü savaşçıdır. - Konfüçyüs",
  "İyi yapılana kadar, daima imkansız görünür. - Nelson Mandela"
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Select quote based on day of the month (1-30 mapping)
  const quoteIndex = useMemo(() => {
    const day = new Date().getDate();
    return (day - 1) % DAILY_QUOTES.length;
  }, []);

  const dailyQuote = DAILY_QUOTES[quoteIndex];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar">
      {/* Header */}
      <SidebarHeader className={`p-4 border-b border-border/30 transition-all ${isCollapsed ? 'items-center px-0' : ''}`}>
        <div 
          className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-sm font-bold tracking-tight text-foreground uppercase truncate">StudyTracker</h2>
              <p className="text-xs text-muted-foreground font-medium truncate">Akademik Takip</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className={`pt-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 mb-2 font-semibold px-2">
              Ana Menü
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-11 px-3 py-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      } ${isCollapsed ? 'justify-center p-0 w-11' : ''}`}
                    >
                      <Link to={item.url} className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-primary' : ''}`} />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer / Daily Quote */}
      <SidebarFooter className={`p-4 border-t border-border/30 transition-all ${isCollapsed ? 'px-2 flex justify-center' : ''}`}>
        {isCollapsed ? (
          <div className="h-10 w-10 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 border border-border group relative cursor-help" title={dailyQuote}>
            <Quote className="h-4 w-4 text-primary opacity-80" />
            {/* Tooltip on hover using standard HTML title for simple collapsed view */}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 rounded-l-lg" />
            <Quote className="h-4 w-4 text-primary/40 absolute top-2 right-2 opacity-20 transform -scale-x-100" />
            <p className="text-[11px] italic font-medium text-muted-foreground leading-relaxed pr-2">
              "{dailyQuote.split('-')[0].trim()}"
            </p>
            <p className="text-[10px] font-bold text-foreground mt-2 text-right">
              — {dailyQuote.split('-')[1]?.trim() || "Anonim"}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
