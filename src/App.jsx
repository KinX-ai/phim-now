import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  Play,
  Heart,
  History,
  Search,
  Home,
  User,
  Film,
  Tv,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Trash2,
  LogOut,
  AlertCircle,
  Clock,
  Star,
  Globe,
  Layers,
  Video,
  MonitorPlay,
  Info,
  CheckCircle2,
  Flame,
  Eye,
  MessageSquare,
  Send,
  ThumbsUp,
  LogIn,
  LayoutGrid
} from 'lucide-react';

// ============================================================================
// 1. FIREBASE INITIALIZATION (MANDATORY PATTERN)
// ============================================================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'phim-now-mobile-app';

// ============================================================================
// 2. NGUONC API CONFIGURATION & CONSTANTS
// ============================================================================
const API_BASE = 'https://phim.nguonc.com/api';

const CATEGORIES = [
  { slug: 'phim-moi-cap-nhat', name: 'Mới cập nhật', isNewEndpoint: true },
  { slug: 'phim-bo', name: 'Phim Bộ' },
  { slug: 'phim-le', name: 'Phim Lẻ' },
  { slug: 'hoat-hinh', name: 'Hoạt Hình' },
  { slug: 'tv-shows', name: 'TV Shows' }
];

const GENRES = [
  { slug: 'hanh-dong', name: 'Hành Động' },
  { slug: 'tinh-cam', name: 'Tình Cảm' },
  { slug: 'hai-huoc', name: 'Hài Hước' },
  { slug: 'co-trang', name: 'Cổ Trang' },
  { slug: 'tam-ly', name: 'Tâm Lý' },
  { slug: 'hinh-su', name: 'Hình Sự' },
  { slug: 'kinh-di', name: 'Kinh Dị' },
  { slug: 'vien-tuong', name: 'Viễn Tưởng' },
  { slug: 'vo-thuat', name: 'Võ Thuật' },
  { slug: 'phiu-luu', name: 'Phiêu Lưu' },
  { slug: 'am-nhac', name: 'Âm Nhạc' },
  { slug: 'gia-dinh', name: 'Gia Đình' },
  { slug: 'hoc-duong', name: 'Học Đường' },
  { slug: 'bi-an', name: 'Bí Ẩn' },
  { slug: 'chien-tranh', name: 'Chiến Tranh' }
];

const COUNTRIES = [
  { slug: 'han-quoc', name: 'Hàn Quốc' },
  { slug: 'trung-quoc', name: 'Trung Quốc' },
  { slug: 'au-my', name: 'Âu Mỹ' },
  { slug: 'nhat-ban', name: 'Nhật Bản' },
  { slug: 'thai-lan', name: 'Thái Lan' },
  { slug: 'viet-nam', name: 'Việt Nam' },
  { slug: 'dai-loan', name: 'Đài Loan' },
  { slug: 'hong-kong', name: 'Hồng Kông' }
];

const FALLBACK_MOVIES = [
  {
    name: 'Trò Chơi Con Mực (Phần 2)',
    slug: 'tro-choi-con-muc-phan-2',
    original_name: 'Squid Game Season 2',
    thumb_url: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=600&q=80',
    poster_url: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=1200&q=80',
    current_episode: 'Hoàn tất (7/7)',
    total_episodes: 7,
    quality: 'FHD',
    language: 'Vietsub + Thuyết Minh',
    time: '60 phút/tập',
    description: 'Seong Gi-hun quay trở lại đấu trường sinh tử với quyết tâm vạch trần những kẻ đứng sau tổ chức bí ẩn và chấm dứt trò chơi tàn khốc này mãi mãi.',
    director: 'Hwang Dong-hyuk',
    casts: 'Lee Jung-jae, Lee Byung-hun, Wi Ha-joon, Im Si-wan'
  },
  {
    name: 'Hành Tinh Cát: Phần Hai',
    slug: 'hanh-tinh-cat-phan-hai',
    original_name: 'Dune: Part Two',
    thumb_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    current_episode: 'Full',
    total_episodes: 1,
    quality: '4K HDR',
    language: 'Vietsub',
    time: '166 phút',
    description: 'Paul Atreides hợp nhất với Chani và người Fremen trong hành trình trả thù những kẻ đã hủy hoại gia tộc mình trên hành tinh sa mạc Arrakis.',
    director: 'Denis Villeneuve',
    casts: 'Timothée Chalamet, Zendaya, Rebecca Ferguson'
  }
];

const SEED_COMMENTS = [
  {
    id: 'seed-1',
    userName: 'Minh Hoàng Cine',
    userAvatar: 'https://ui-avatars.com/api/?name=Minh+Hoang&background=e11d48&color=fff',
    rating: 5,
    content: 'Phim cuốn thực sự! Hình ảnh nét căng, phụ đề Vietsub chuẩn từng câu. Đáng xem nhất tuần này nhé mọi người!',
    createdAt: Date.now() - 3600 * 1000 * 5,
    likes: 24
  },
  {
    id: 'seed-2',
    userName: 'Thảo Vy Nguyễn',
    userAvatar: 'https://ui-avatars.com/api/?name=Thao+Vy&background=0284c7&color=fff',
    rating: 5,
    content: 'Mạch phim nhanh, diễn xuất đỉnh cao. Xem trên Phim Now load mượt không bị giật lag chút nào.',
    createdAt: Date.now() - 3600 * 1000 * 18,
    likes: 15
  },
  {
    id: 'seed-3',
    userName: 'Tuấn Kiệt',
    userAvatar: 'https://ui-avatars.com/api/?name=Tuan+Kiet&background=7c3aed&color=fff',
    rating: 4,
    content: 'Cốt truyện bất ngờ ở nửa sau, nhạc phim cũng rất hợp tâm trạng. Chấm 9/10 điểm!',
    createdAt: Date.now() - 3600 * 1000 * 42,
    likes: 9
  }
];

// ============================================================================
// 3. CUSTOM SVG LOGO: "PHIM NOW" & DRAG-TO-SCROLL CONTAINER (NO SCROLLBARS)
// ============================================================================
const PhimNowLogo = ({ size = 'md', onClick }) => {
  const isLarge = size === 'lg';
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 select-none ${
        onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''
      }`}
    >
      {/* Custom SVG Cinema Reel + Play Icon */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 shadow-lg shadow-rose-600/30 ${
          isLarge ? 'w-10 h-10' : 'w-8 h-8'
        }`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          className={isLarge ? 'w-6 h-6' : 'w-5 h-5'}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="3"
            y="5"
            width="30"
            height="26"
            rx="6"
            stroke="white"
            strokeOpacity="0.35"
            strokeWidth="2"
          />
          <circle cx="7" cy="10" r="1.5" fill="white" fillOpacity="0.8" />
          <circle cx="7" cy="18" r="1.5" fill="white" fillOpacity="0.8" />
          <circle cx="7" cy="26" r="1.5" fill="white" fillOpacity="0.8" />
          <circle cx="29" cy="10" r="1.5" fill="white" fillOpacity="0.8" />
          <circle cx="29" cy="18" r="1.5" fill="white" fillOpacity="0.8" />
          <circle cx="29" cy="26" r="1.5" fill="white" fillOpacity="0.8" />
          <path
            d="M14.5 11.8C14.5 11.0112 15.3701 10.5327 16.0368 10.957L24.2082 16.157C24.8247 16.5493 24.8247 17.4507 24.2082 17.843L16.0368 23.043C15.3701 23.4673 14.5 22.9888 14.5 22.2V11.8Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Typography PHIM NOW */}
      <div className="flex items-center tracking-tight leading-none">
        <span
          className={`font-black text-white tracking-tighter ${
            isLarge ? 'text-lg' : 'text-sm'
          }`}
        >
          PHIM
        </span>
        <span
          className={`ml-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black uppercase tracking-wider shadow-sm ${
            isLarge ? 'text-xs' : 'text-[10px]'
          }`}
        >
          NOW
        </span>
      </div>
    </div>
  );
};

/**
 * Horizontal touch & mouse drag-to-scroll wrapper with completely hidden scrollbars
 */
const DragScrollRow = ({ children, className = '' }) => {
  const rowRef = useRef(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e) => {
    const slider = rowRef.current;
    if (!slider) return;
    isDownRef.current = true;
    startXRef.current = e.pageX - slider.offsetLeft;
    scrollLeftRef.current = slider.scrollLeft;
  };

  const handleMouseLeaveOrUp = () => {
    isDownRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDownRef.current) return;
    const slider = rowRef.current;
    if (!slider) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    slider.scrollLeft = scrollLeftRef.current - walk;
  };

  return (
    <div
      ref={rowRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeaveOrUp}
      onMouseUp={handleMouseLeaveOrUp}
      onMouseMove={handleMouseMove}
      className={`flex overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  );
};

// ============================================================================
// 4. HELPER UTILITIES
// ============================================================================
function getBaseViews(slug = '') {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 900000;
  }
  return 18500 + (hash % 180000);
}

function formatViews(num = 0) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function stripHtmlTags(html = '') {
  if (!html) return 'Đang cập nhật nội dung chi tiết cho bộ phim này.';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchNguonC(endpoint) {
  const targetUrl = `${API_BASE}${endpoint}`;
  const urlsToTry = [
    targetUrl,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  let lastError = null;
  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && (data.status === 'success' || data.items || data.movie)) {
        return data;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Không thể kết nối tới máy chủ NguonC');
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Vừa xong';
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

function parseMovieCategories(categoryObj) {
  if (!categoryObj || typeof categoryObj !== 'object') return [];
  const tags = [];
  Object.values(categoryObj).forEach((group) => {
    if (group && Array.isArray(group.list)) {
      group.list.forEach((item) => {
        if (item?.name) tags.push({ group: group.group?.name || '', name: item.name });
      });
    }
  });
  return tags;
}

// ============================================================================
// 5. HLS M3U8 VIDEO PLAYER COMPONENT
// ============================================================================
const HlsVideoPlayer = ({ src, poster, title }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setError(null);
    setIsLoading(true);
    if (!src) {
      setError('Không tìm thấy luồng M3U8 cho tập này.');
      setIsLoading(false);
      return;
    }

    let hlsInstance = null;
    const video = videoRef.current;
    if (!video) return;

    const initPlayer = () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', () => setIsLoading(false));
        video.addEventListener('error', () => {
          setError('Không thể phát luồng M3U8 trực tiếp. Hãy chuyển sang chế độ Embed.');
          setIsLoading(false);
        });
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(() => {});
        });
        hlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setError('Luồng M3U8 bị chặn CORS hoặc lỗi mạng. Vui lòng dùng chế độ Embed Player.');
            setIsLoading(false);
          }
        });
      } else {
        setError('Trình duyệt không hỗ trợ HLS.');
        setIsLoading(false);
      }
    };

    if (!window.Hls && !video.canPlayType('application/vnd.apple.mpegurl')) {
      const existingScript = document.getElementById('hls-cdn-script');
      if (existingScript) {
        existingScript.addEventListener('load', initPlayer);
      } else {
        const script = document.createElement('script');
        script.id = 'hls-cdn-script';
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
        script.async = true;
        script.onload = initPlayer;
        script.onerror = () => {
          setError('Không thể tải thư viện HLS. Hãy sử dụng chế độ Embed.');
          setIsLoading(false);
        };
        document.body.appendChild(script);
      }
    } else {
      initPlayer();
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [src]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs text-zinc-400">Đang tải luồng HLS M3U8...</span>
        </div>
      )}
      {error ? (
        <div className="p-6 text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-zinc-300 mb-2">{error}</p>
          <p className="text-[11px] text-zinc-500">
            Mẹo: Bấm nút "Embed" ở góc phải dưới trình phát để xem mượt mà.
          </p>
        </div>
      ) : (
        <video
          ref={videoRef}
          poster={poster}
          controls
          playsInline
          className="w-full h-full object-contain bg-black"
          title={title}
        />
      )}
    </div>
  );
};

// ============================================================================
// 6. REUSABLE MOVIE CARD COMPONENT
// ============================================================================
const MovieCard = ({
  movie,
  onSelect,
  isFavorite,
  onToggleFavorite,
  badgeText,
  rankNumber,
  viewCount
}) => {
  const [imgError, setImgError] = useState(false);
  const thumbUrl =
    !imgError && movie.thumb_url
      ? movie.thumb_url
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

  const displayViews = viewCount || getBaseViews(movie.slug);

  return (
    <div
      onClick={() => onSelect(movie.slug, movie)}
      className="group relative flex flex-col cursor-pointer select-none"
    >
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-lg">
        <img
          src={thumbUrl}
          alt={movie.name}
          loading="lazy"
          draggable={false}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {rankNumber && (
          <div
            className={`absolute top-0 left-0 w-8 h-8 rounded-br-2xl flex items-center justify-center font-black text-xs shadow-lg z-10 ${
              rankNumber === 1
                ? 'bg-gradient-to-br from-amber-400 to-rose-600 text-black'
                : rankNumber === 2
                ? 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-black'
                : rankNumber === 3
                ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                : 'bg-black/80 text-white border-r border-b border-white/15'
            }`}
          >
            #{rankNumber}
          </div>
        )}

        <div
          className={`absolute top-2 ${
            rankNumber ? 'left-9' : 'left-2'
          } right-2 flex items-center justify-between gap-1 pointer-events-none`}
        >
          {movie.current_episode && (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide bg-rose-600/95 text-white rounded-md shadow-sm truncate max-w-[75%]">
              {movie.current_episode}
            </span>
          )}
          {movie.quality && (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/90 text-black rounded-md">
              {movie.quality}
            </span>
          )}
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(movie);
            }}
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              isFavorite
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                : 'bg-black/60 text-zinc-200 hover:bg-black/80 border border-white/15'
            }`}
            title={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        <div className="absolute bottom-2 left-2 right-11 pointer-events-none flex flex-col gap-0.5">
          {(badgeText || movie.language) && (
            <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-black/70 backdrop-blur-md text-zinc-200 rounded-md border border-white/10 truncate max-w-fit">
              {badgeText || movie.language}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-300 font-medium drop-shadow">
            <Eye className="w-3 h-3 text-rose-400" /> {formatViews(displayViews)}
          </span>
        </div>
      </div>

      <h3 className="mt-2 text-xs sm:text-sm font-semibold text-zinc-100 line-clamp-1 group-hover:text-rose-400 transition-colors">
        {movie.name}
      </h3>
      <p className="text-[11px] text-zinc-500 line-clamp-1">
        {movie.original_name || 'Phim Now'}
      </p>
    </div>
  );
};

// ============================================================================
// 7. MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // Primary Screen & Navigation State
  // activeScreen: 'login' | 'main' | 'movieInfo' | 'player'
  const [activeScreen, setActiveScreen] = useState('main');
  // activeTab (Bottom Navigation Menu): 'home' | 'explore' | 'trending' | 'history' | 'favorites' | 'account'
  const [activeTab, setActiveTab] = useState('home');
  const [osStyle, setOsStyle] = useState('ios');
  const [toast, setToast] = useState(null);

  // Firebase Auth & Google Profile State
  const [user, setUser] = useState(null);
  const [googleProfile, setGoogleProfile] = useState(null);
  const [showGoogleSimModal, setShowGoogleSimModal] = useState(false);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState('');
  const [simNameInput, setSimNameInput] = useState('');
  const [simEmailInput, setSimEmailInput] = useState('');

  // Cloud Data State (Firestore)
  const [favorites, setFavorites] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [movieStatsMap, setMovieStatsMap] = useState({});
  const [allComments, setAllComments] = useState([]);
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [defaultPlayerMode, setDefaultPlayerMode] = useState('embed');

  // Home & Trending Feed State
  const [homeData, setHomeData] = useState({
    newlyUpdated: [],
    phimBo: [],
    phimLe: [],
    hoatHinh: [],
    tvShows: []
  });
  const [homeLoading, setHomeLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [trendingPeriod, setTrendingPeriod] = useState('day');

  // Explore / Filter / Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreFilterType, setExploreFilterType] = useState('danh-sach');
  const [exploreSlug, setExploreSlug] = useState('phim-moi-cap-nhat');
  const [explorePage, setExplorePage] = useState(1);
  const [exploreTotalPages, setExploreTotalPages] = useState(1);
  const [exploreMovies, setExploreMovies] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);

  // History Page Search & Confirm Clear State
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  // Movie Info Page & Video Player Page State
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [movieDetail, setMovieDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [activeServerIdx, setActiveServerIdx] = useState(0);
  const [activeEpisodeIdx, setActiveEpisodeIdx] = useState(0);
  const [playerType, setPlayerType] = useState('embed');
  const [episodeSearch, setEpisodeSearch] = useState('');

  // Comment Input State
  const [commentRating, setCommentRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // ============================================================================
  // FIREBASE AUTHENTICATION (RULE 3)
  // ============================================================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ============================================================================
  // FIRESTORE REAL-TIME SYNC: FAVORITES, HISTORY, PROFILE, COMMENTS & VIEWS
  // ============================================================================
  useEffect(() => {
    if (!user) return;

    const favColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'favorites');
    const unsubFav = onSnapshot(
      favColRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        setFavorites(items);
      },
      (err) => console.error('Favorites sync error:', err)
    );

    const histColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    const unsubHist = onSnapshot(
      histColRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0));
        setHistoryList(items);
      },
      (err) => console.error('History sync error:', err)
    );

    const profileColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'profile');
    const unsubProfile = onSnapshot(
      profileColRef,
      (snapshot) => {
        const infoDoc = snapshot.docs.find((d) => d.id === 'google_account');
        if (infoDoc) {
          setGoogleProfile(infoDoc.data());
        } else if (user.displayName || user.email) {
          setGoogleProfile({
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            isGoogleLinked: true
          });
        } else {
          setGoogleProfile(null);
        }
      },
      (err) => console.error('Profile sync error:', err)
    );

    const statsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'movie_stats');
    const unsubStats = onSnapshot(
      statsColRef,
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((d) => {
          map[d.id] = d.data();
        });
        setMovieStatsMap(map);
      },
      (err) => console.error('Stats sync error:', err)
    );

    const commentsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'comments');
    const unsubComments = onSnapshot(
      commentsColRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAllComments(list);
      },
      (err) => console.error('Comments sync error:', err)
    );

    return () => {
      unsubFav();
      unsubHist();
      unsubProfile();
      unsubStats();
      unsubComments();
    };
  }, [user]);

  const getMovieViews = useCallback(
    (slug) => {
      if (!slug) return 15000;
      const cloudViews = movieStatsMap[slug]?.views || 0;
      return getBaseViews(slug) + cloudViews;
    },
    [movieStatsMap]
  );

  const incrementMovieViewCount = useCallback(
    async (movie) => {
      if (!user || !movie?.slug) return;
      try {
        const statRef = doc(db, 'artifacts', appId, 'public', 'data', 'movie_stats', movie.slug);
        const currentCloudViews = movieStatsMap[movie.slug]?.views || 0;
        await setDoc(
          statRef,
          {
            slug: movie.slug,
            name: movie.name || '',
            thumb_url: movie.thumb_url || '',
            views: currentCloudViews + 1,
            lastViewedAt: Date.now()
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error incrementing view count:', err);
      }
    },
    [user, movieStatsMap]
  );

  // ============================================================================
  // GOOGLE LOGIN HANDLER
  // ============================================================================
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const profileData = {
          displayName: result.user.displayName || 'Người dùng Google',
          email: result.user.email || 'user@gmail.com',
          photoURL:
            result.user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              result.user.displayName || 'G'
            )}&background=e11d48&color=fff`,
          isGoogleLinked: true,
          linkedAt: Date.now()
        };
        await setDoc(
          doc(db, 'artifacts', appId, 'users', result.user.uid, 'profile', 'google_account'),
          profileData
        );
        setShowLoginPromptModal(false);
        if (activeScreen === 'login') setActiveScreen('main');
        showToast(`Xin chào, ${profileData.displayName}!`);
      }
    } catch (error) {
      setSimNameInput(googleProfile?.displayName || 'Nguyễn Minh Quân');
      setSimEmailInput(googleProfile?.email || 'minhquan.phimnow@gmail.com');
      setShowGoogleSimModal(true);
    }
  };

  const handleConfirmSimulatedGoogle = async (e) => {
    e.preventDefault();
    if (!user) return;
    const cleanName = simNameInput.trim() || 'Người dùng Google';
    const cleanEmail = simEmailInput.trim() || 'user@gmail.com';
    const profileData = {
      displayName: cleanName,
      email: cleanEmail,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        cleanName
      )}&background=e11d48&color=fff&bold=true`,
      isGoogleLinked: true,
      linkedAt: Date.now()
    };
    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'google_account'),
        profileData
      );
      setShowGoogleSimModal(false);
      setShowLoginPromptModal(false);
      if (activeScreen === 'login') setActiveScreen('main');
      showToast(`Đã đăng nhập Google: ${cleanEmail}`);
    } catch (err) {
      showToast('Lỗi lưu thông tin tài khoản', 'error');
    }
  };

  const handleLogoutGoogle = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'google_account'));
      setGoogleProfile(null);
      showToast('Đã đăng xuất khỏi tài khoản Google');
    } catch (err) {
      console.error(err);
    }
  };

  // ============================================================================
  // CLOUD FAVORITES, WATCH HISTORY & COMMENTS ACTIONS
  // ============================================================================
  const isMovieFavorite = useCallback(
    (slug) => favorites.some((item) => item.slug === slug),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (movieObj) => {
      if (!movieObj?.slug) return;
      if (!googleProfile) {
        setLoginPromptReason(
          'Đăng nhập bằng Google để lưu và đồng bộ Tủ Phim Yêu Thích trên mọi thiết bị.'
        );
        setShowLoginPromptModal(true);
        return;
      }
      if (!user) return;
      const slug = movieObj.slug;
      const favRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', slug);
      const exists = favorites.some((item) => item.slug === slug);

      try {
        if (exists) {
          await deleteDoc(favRef);
          showToast(`Đã xóa "${movieObj.name}" khỏi Yêu thích`, 'info');
        } else {
          await setDoc(favRef, {
            slug: movieObj.slug,
            name: movieObj.name || '',
            original_name: movieObj.original_name || '',
            thumb_url: movieObj.thumb_url || '',
            poster_url: movieObj.poster_url || movieObj.thumb_url || '',
            current_episode: movieObj.current_episode || '',
            quality: movieObj.quality || 'HD',
            language: movieObj.language || 'Vietsub',
            addedAt: Date.now()
          });
          showToast(`Đã lưu "${movieObj.name}" vào Yêu thích`);
        }
      } catch (err) {
        console.error('Error toggling favorite:', err);
        showToast('Không thể cập nhật danh sách Yêu thích', 'error');
      }
    },
    [user, googleProfile, favorites, showToast]
  );

  const recordWatchHistory = useCallback(
    async (movie, episodeItem, serverName, serverIdx, episodeIdx) => {
      if (!user || !autoSaveHistory || !movie?.slug) return;
      try {
        const histRef = doc(db, 'artifacts', appId, 'users', user.uid, 'history', movie.slug);
        await setDoc(histRef, {
          slug: movie.slug,
          name: movie.name || '',
          original_name: movie.original_name || '',
          thumb_url: movie.thumb_url || '',
          poster_url: movie.poster_url || movie.thumb_url || '',
          episode_name: episodeItem?.name || 'Full',
          episode_slug: episodeItem?.slug || '',
          server_name: serverName || 'Vietsub #1',
          server_idx: serverIdx || 0,
          episode_idx: episodeIdx || 0,
          current_episode: movie.current_episode || '',
          quality: movie.quality || 'HD',
          watchedAt: Date.now()
        });
      } catch (err) {
        console.error('Error saving watch history:', err);
      }
    },
    [user, autoSaveHistory]
  );

  const removeHistoryItem = async (slug) => {
    if (!user || !slug) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', slug));
      showToast('Đã xóa phim khỏi lịch sử xem', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllHistory = async () => {
    if (!user || historyList.length === 0) return;
    try {
      await Promise.all(
        historyList.map((item) =>
          deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', item.slug))
        )
      );
      setConfirmClearHistory(false);
      showToast('Đã xóa toàn bộ lịch sử xem phim', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!movieDetail?.slug) return;
    if (!googleProfile) {
      setLoginPromptReason(
        'Vui lòng đăng nhập bằng Google để gửi bình luận và đánh giá sao cho bộ phim này.'
      );
      setShowLoginPromptModal(true);
      return;
    }
    if (!commentText.trim()) {
      showToast('Vui lòng nhập nội dung bình luận', 'info');
      return;
    }
    if (!user) return;

    setSubmittingComment(true);
    try {
      const commentId = `${movieDetail.slug}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const commentRef = doc(db, 'artifacts', appId, 'public', 'data', 'comments', commentId);
      await setDoc(commentRef, {
        movieSlug: movieDetail.slug,
        movieName: movieDetail.name || '',
        userId: user.uid,
        userName: googleProfile.displayName,
        userEmail: googleProfile.email,
        userAvatar: googleProfile.photoURL,
        rating: commentRating,
        content: commentText.trim(),
        likes: 0,
        likedBy: [],
        createdAt: Date.now()
      });
      setCommentText('');
      setCommentRating(5);
      showToast('Đã đăng bình luận của bạn!');
    } catch (err) {
      console.error('Post comment error:', err);
      showToast('Không thể gửi bình luận lúc này', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentObj) => {
    if (!user || !commentObj?.id || commentObj.id.startsWith('seed-')) {
      showToast('Đã thích bình luận!');
      return;
    }
    try {
      const commentRef = doc(db, 'artifacts', appId, 'public', 'data', 'comments', commentObj.id);
      const likedBy = Array.isArray(commentObj.likedBy) ? commentObj.likedBy : [];
      const alreadyLiked = likedBy.includes(user.uid);
      const updatedLikes = alreadyLiked
        ? Math.max(0, (commentObj.likes || 1) - 1)
        : (commentObj.likes || 0) + 1;
      const updatedLikedBy = alreadyLiked
        ? likedBy.filter((id) => id !== user.uid)
        : [...likedBy, user.uid];

      await setDoc(
        commentRef,
        {
          likes: updatedLikes,
          likedBy: updatedLikedBy
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Like comment error:', err);
    }
  };

  // ============================================================================
  // FETCH HOME FEED DATA FROM NGUONC API
  // ============================================================================
  const loadHomeFeeds = useCallback(async () => {
    setHomeLoading(true);
    try {
      const [newRes, boRes, leRes, hhRes, tvRes] = await Promise.allSettled([
        fetchNguonC('/films/phim-moi-cap-nhat?page=1'),
        fetchNguonC('/films/danh-sach/phim-bo?page=1'),
        fetchNguonC('/films/danh-sach/phim-le?page=1'),
        fetchNguonC('/films/danh-sach/hoat-hinh?page=1'),
        fetchNguonC('/films/danh-sach/tv-shows?page=1')
      ]);

      const newlyUpdated =
        newRes.status === 'fulfilled' && newRes.value?.items?.length
          ? newRes.value.items
          : FALLBACK_MOVIES;

      setHomeData({
        newlyUpdated,
        phimBo: boRes.status === 'fulfilled' ? boRes.value?.items || [] : [],
        phimLe: leRes.status === 'fulfilled' ? leRes.value?.items || [] : [],
        hoatHinh: hhRes.status === 'fulfilled' ? hhRes.value?.items || [] : [],
        tvShows: tvRes.status === 'fulfilled' ? tvRes.value?.items || [] : []
      });
    } catch (err) {
      setHomeData((prev) => ({ ...prev, newlyUpdated: FALLBACK_MOVIES }));
    } finally {
      setHomeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeFeeds();
  }, [loadHomeFeeds]);

  const mostViewedMovies = useMemo(() => {
    const poolMap = new Map();
    [
      ...homeData.newlyUpdated,
      ...homeData.phimBo,
      ...homeData.phimLe,
      ...homeData.hoatHinh
    ].forEach((m) => {
      if (m && m.slug && !poolMap.has(m.slug)) {
        poolMap.set(m.slug, {
          ...m,
          totalViews: getMovieViews(m.slug)
        });
      }
    });
    const list = Array.from(poolMap.values());
    if (trendingPeriod === 'day') {
      list.sort((a, b) => b.totalViews - a.totalViews);
    } else if (trendingPeriod === 'week') {
      list.sort((a, b) => (b.totalViews % 95000) - (a.totalViews % 95000));
    } else {
      list.sort((a, b) => (b.totalViews % 60000) - (a.totalViews % 60000));
    }
    return list.slice(0, 15);
  }, [homeData, getMovieViews, trendingPeriod]);

  const heroMovies = useMemo(
    () => homeData.newlyUpdated.slice(0, 6),
    [homeData.newlyUpdated]
  );

  useEffect(() => {
    if (heroMovies.length <= 1 || activeScreen !== 'main' || activeTab !== 'home') return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroMovies.length, activeScreen, activeTab]);

  // ============================================================================
  // FETCH EXPLORE & SEARCH DATA FROM NGUONC API
  // ============================================================================
  const loadExploreMovies = useCallback(async () => {
    setExploreLoading(true);
    try {
      let endpoint = '';
      if (searchQuery.trim().length > 0) {
        endpoint = `/films/search?keyword=${encodeURIComponent(searchQuery.trim())}`;
      } else if (exploreSlug === 'phim-moi-cap-nhat') {
        endpoint = `/films/phim-moi-cap-nhat?page=${explorePage}`;
      } else {
        endpoint = `/films/${exploreFilterType}/${exploreSlug}?page=${explorePage}`;
      }

      const data = await fetchNguonC(endpoint);
      setExploreMovies(data.items || []);
      setExploreTotalPages(data.paginate?.total_page || 1);
    } catch (err) {
      setExploreMovies([]);
    } finally {
      setExploreLoading(false);
    }
  }, [searchQuery, exploreFilterType, exploreSlug, explorePage]);

  useEffect(() => {
    if (activeScreen !== 'main' || activeTab !== 'explore') return;
    const timer = setTimeout(() => {
      loadExploreMovies();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeScreen, activeTab, loadExploreMovies]);

  // ============================================================================
  // OPEN DEDICATED MOVIE INFO PAGE OR DIRECT VIDEO PLAYER PAGE
  // ============================================================================
  const openMovieDetail = useCallback(
    async (slug, fallbackMovieObj = null, directPlayerConfig = null) => {
      if (!slug) return;
      setSelectedSlug(slug);
      setDetailLoading(true);
      setDetailError(null);
      setEpisodeSearch('');
      setPlayerType(defaultPlayerMode);

      if (directPlayerConfig?.openPlayerScreen) {
        setActiveScreen('player');
      } else {
        setActiveScreen('movieInfo');
      }

      try {
        const data = await fetchNguonC(`/film/${slug}`);
        if (data?.movie) {
          const movie = data.movie;
          setMovieDetail(movie);
          incrementMovieViewCount(movie);

          let sIdx = 0;
          let eIdx = 0;

          if (directPlayerConfig) {
            if (
              typeof directPlayerConfig.serverIdx === 'number' &&
              movie.episodes?.[directPlayerConfig.serverIdx]
            ) {
              sIdx = directPlayerConfig.serverIdx;
            }
            const epList = movie.episodes?.[sIdx]?.items || [];
            if (directPlayerConfig.episodeName) {
              const foundIdx = epList.findIndex(
                (ep) =>
                  ep.name === directPlayerConfig.episodeName ||
                  ep.slug === directPlayerConfig.episodeSlug
              );
              if (foundIdx !== -1) eIdx = foundIdx;
            } else if (
              typeof directPlayerConfig.episodeIdx === 'number' &&
              epList[directPlayerConfig.episodeIdx]
            ) {
              eIdx = directPlayerConfig.episodeIdx;
            }
          } else {
            const existingHist = historyList.find((h) => h.slug === slug);
            if (existingHist && movie.episodes?.length) {
              const foundServer = movie.episodes.findIndex(
                (s) => s.server_name === existingHist.server_name
              );
              if (foundServer !== -1) sIdx = foundServer;
              const epList = movie.episodes[sIdx]?.items || [];
              const foundEp = epList.findIndex((e) => e.name === existingHist.episode_name);
              if (foundEp !== -1) eIdx = foundEp;
            }
          }

          setActiveServerIdx(sIdx);
          setActiveEpisodeIdx(eIdx);

          if (directPlayerConfig?.openPlayerScreen && movie.episodes?.[sIdx]?.items?.[eIdx]) {
            recordWatchHistory(
              movie,
              movie.episodes[sIdx].items[eIdx],
              movie.episodes[sIdx].server_name,
              sIdx,
              eIdx
            );
          }
        } else {
          throw new Error('Không tìm thấy chi tiết phim');
        }
      } catch (err) {
        if (fallbackMovieObj) {
          setMovieDetail({
            ...fallbackMovieObj,
            episodes: [
              {
                server_name: 'Vietsub #1',
                items: [
                  {
                    name: '1',
                    slug: 'tap-1',
                    embed: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    m3u8: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
                  }
                ]
              }
            ]
          });
        } else {
          setDetailError('Không thể tải dữ liệu phim từ NguonC. Vui lòng thử lại.');
        }
      } finally {
        setDetailLoading(false);
      }
    },
    [defaultPlayerMode, historyList, incrementMovieViewCount, recordWatchHistory]
  );

  const currentServer = useMemo(
    () => movieDetail?.episodes?.[activeServerIdx] || null,
    [movieDetail, activeServerIdx]
  );

  const currentEpisode = useMemo(
    () => currentServer?.items?.[activeEpisodeIdx] || null,
    [currentServer, activeEpisodeIdx]
  );

  const handleStartWatchingEpisode = (sIdx, eIdx) => {
    setActiveServerIdx(sIdx);
    setActiveEpisodeIdx(eIdx);
    setActiveScreen('player');
    if (movieDetail) {
      const server = movieDetail.episodes?.[sIdx];
      const ep = server?.items?.[eIdx];
      if (ep) {
        recordWatchHistory(movieDetail, ep, server.server_name, sIdx, eIdx);
      }
    }
  };

  const filteredEpisodes = useMemo(() => {
    const items = currentServer?.items || [];
    if (!episodeSearch.trim()) return items.map((ep, idx) => ({ ...ep, originalIdx: idx }));
    return items
      .map((ep, idx) => ({ ...ep, originalIdx: idx }))
      .filter((ep) => ep.name.toLowerCase().includes(episodeSearch.trim().toLowerCase()));
  }, [currentServer, episodeSearch]);

  const currentMovieComments = useMemo(() => {
    if (!selectedSlug) return SEED_COMMENTS;
    const real = allComments.filter((c) => c.movieSlug === selectedSlug);
    return [...real, ...SEED_COMMENTS];
  }, [allComments, selectedSlug]);

  const averageMovieRating = useMemo(() => {
    if (!currentMovieComments.length) return '4.9';
    const sum = currentMovieComments.reduce((acc, c) => acc + (Number(c.rating) || 5), 0);
    return (sum / currentMovieComments.length).toFixed(1);
  }, [currentMovieComments]);

  const navigateToFilter = (filterType, slug) => {
    setSearchQuery('');
    setExploreFilterType(filterType);
    setExploreSlug(slug);
    setExplorePage(1);
    setActiveTab('explore');
    setActiveScreen('main');
  };

  const handleBottomTabClick = (tabId) => {
    setActiveTab(tabId);
    setActiveScreen('main');
  };

  // ============================================================================
  // REUSABLE REAL-TIME COMMENTS & RATING COMPONENT
  // ============================================================================
  const renderCommentsSection = () => (
    <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-extrabold text-white">
            Bình Luận & Đánh Giá ({currentMovieComments.length})
          </h3>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-current" /> {averageMovieRating}/5.0
        </div>
      </div>

      <form
        onSubmit={handlePostComment}
        className="space-y-3 bg-zinc-950/90 p-3.5 rounded-2xl border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {googleProfile ? (
              <img
                src={googleProfile.photoURL}
                alt={googleProfile.displayName}
                className="w-7 h-7 rounded-full object-cover border border-rose-500"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <User className="w-4 h-4" />
              </div>
            )}
            <span className="text-xs font-bold text-zinc-200">
              {googleProfile ? googleProfile.displayName : 'Khách (Cần đăng nhập Google)'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCommentRating(star)}
                className="p-0.5 transition-transform active:scale-125"
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= commentRating ? 'text-amber-400 fill-current' : 'text-zinc-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              googleProfile
                ? 'Chia sẻ cảm nhận của bạn về bộ phim này...'
                : 'Đăng nhập Google để bình luận về phim...'
            }
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            disabled={submittingComment}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Gửi
          </button>
        </div>
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
        {currentMovieComments.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-start gap-3"
          >
            <img
              src={
                item.userAvatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  item.userName || 'U'
                )}&background=e11d48&color=fff`
              }
              alt={item.userName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate">{item.userName}</span>
                <span className="text-[10px] text-zinc-500">{formatTimeAgo(item.createdAt)}</span>
              </div>
              <div className="flex items-center gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= (item.rating || 5) ? 'text-amber-400 fill-current' : 'text-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed break-words">{item.content}</p>
              <div className="mt-2 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleLikeComment(item)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-rose-400 transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" /> Thích ({item.likes || 0})
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // 1. DEDICATED CINEMA LOGIN SCREEN (activeScreen === 'login')
  // ============================================================================
  const renderDedicatedLoginScreen = () => (
    <div className="relative flex-1 overflow-y-auto no-scrollbar flex flex-col justify-between p-5 select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={
            homeData.newlyUpdated[0]?.poster_url ||
            'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=1200&q=80'
          }
          alt="Phim Now Background"
          className="w-full h-full object-cover scale-105 opacity-35 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-[#090b10]/85 to-[#090b10]/50" />
      </div>

      {/* Top Bar with Custom PHIM NOW Logo */}
      <div className="relative z-10 flex items-center justify-between">
        <PhimNowLogo size="lg" onClick={() => setActiveScreen('main')} />
        <button
          onClick={() => setActiveScreen('main')}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-bold text-zinc-200 border border-white/15"
        >
          Đóng
        </button>
      </div>

      {/* Center Branding & Features */}
      <div className="relative z-10 my-auto py-6 space-y-5 text-center max-w-sm mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-400 text-xs font-extrabold">
          <Sparkles className="w-3.5 h-3.5" /> PHIM NOW • RẠP PHIM DI ĐỘNG
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
          Trải nghiệm điện ảnh <span className="text-rose-500">Full HD</span> mọi lúc mọi nơi
        </h1>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Kho phim tốc độ cao cập nhật liên tục từ NguonC. Đăng nhập bằng Google để đồng bộ{' '}
          <strong className="text-white">Lịch sử xem phim</strong>,{' '}
          <strong className="text-white">Tủ phim yêu thích</strong> và{' '}
          <strong className="text-white">Bình luận</strong> trên iOS & Android.
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1 text-left">
          <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
            <History className="w-4 h-4 text-amber-400 mb-1" />
            <div className="text-[11px] font-bold text-white">Nhớ Tập Xem</div>
            <div className="text-[10px] text-zinc-400">Tự động lưu lịch sử</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
            <Heart className="w-4 h-4 text-rose-500 mb-1" />
            <div className="text-[11px] font-bold text-white">Tủ Yêu Thích</div>
            <div className="text-[10px] text-zinc-400">Đồng bộ đám mây</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
            <MessageSquare className="w-4 h-4 text-emerald-400 mb-1" />
            <div className="text-[11px] font-bold text-white">Bình Luận</div>
            <div className="text-[10px] text-zinc-400">Đánh giá 1-5 sao</div>
          </div>
        </div>
      </div>

      {/* Bottom Login Actions */}
      <div className="relative z-10 space-y-2.5 max-w-sm mx-auto w-full pb-2">
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
            />
          </svg>
          Tiếp tục bằng tài khoản Google
        </button>

        <button
          onClick={() => {
            setActiveScreen('main');
            showToast('Đang trải nghiệm ở chế độ Khách (Guest Mode)', 'info');
          }}
          className="w-full py-3 px-5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 font-bold text-xs border border-white/15 flex items-center justify-center gap-2 transition-all"
        >
          <User className="w-4 h-4 text-zinc-400" /> Xem ngay không cần đăng nhập
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // 2. DANH MỤC / MENU THỂ LOẠI & QUỐC GIA TAB (activeTab === 'explore')
  // ============================================================================
  const renderExploreTab = () => {
    const activeFilterList =
      exploreFilterType === 'danh-sach'
        ? CATEGORIES
        : exploreFilterType === 'the-loai'
        ? GENRES
        : COUNTRIES;

    return (
      <div className="px-4 pt-3 pb-8 space-y-4">
        {/* Category / Genre / Country Menu Filter Card */}
        {!searchQuery.trim() && (
          <div className="p-3.5 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-2xl border border-white/10">
              {[
                { id: 'danh-sach', label: 'Loạt Phim', icon: Film },
                { id: 'the-loai', label: 'Thể Loại', icon: Sparkles },
                { id: 'quoc-gia', label: 'Quốc Gia', icon: Globe }
              ].map((group) => {
                const Icon = group.icon;
                const active = exploreFilterType === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setExploreFilterType(group.id);
                      const defaultSlug =
                        group.id === 'danh-sach'
                          ? 'phim-moi-cap-nhat'
                          : group.id === 'the-loai'
                          ? 'hanh-dong'
                          : 'han-quoc';
                      setExploreSlug(defaultSlug);
                      setExplorePage(1);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      active
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{group.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Smooth Drag-to-Scroll Pill Row (Zero Scrollbar) */}
            <DragScrollRow className="gap-1.5 pb-0.5">
              {activeFilterList.map((item) => {
                const isSelected = exploreSlug === item.slug;
                return (
                  <button
                    key={item.slug}
                    onClick={() => {
                      setExploreSlug(item.slug);
                      setExplorePage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                      isSelected
                        ? 'bg-white text-zinc-950 shadow'
                        : 'bg-zinc-950/90 text-zinc-300 border border-white/10 hover:border-rose-500/40'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </DragScrollRow>
          </div>
        )}

        {/* Results Header & Page Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs sm:text-sm font-extrabold text-white">
              {searchQuery.trim()
                ? `Kết quả tìm kiếm: "${searchQuery}"`
                : `Danh mục: ${
                    activeFilterList.find((i) => i.slug === exploreSlug)?.name || 'Phim'
                  }`}
            </h2>
          </div>
          {!searchQuery.trim() && (
            <span className="text-[11px] text-zinc-400 font-semibold">
              Trang {explorePage}/{exploreTotalPages}
            </span>
          )}
        </div>

        {/* Movies Grid */}
        {exploreLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <div
                key={n}
                className="aspect-[2/3] rounded-2xl bg-zinc-900 border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : exploreMovies.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <Film className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-xs font-bold text-zinc-300">Không tìm thấy bộ phim nào phù hợp</p>
            <p className="text-[11px] text-zinc-500">Hãy thử từ khóa hoặc thể loại khác.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {exploreMovies.map((movie) => (
                <MovieCard
                  key={movie.slug}
                  movie={movie}
                  viewCount={getMovieViews(movie.slug)}
                  onSelect={openMovieDetail}
                  isFavorite={isMovieFavorite(movie.slug)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>

            {!searchQuery.trim() && exploreTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  disabled={explorePage <= 1}
                  onClick={() => setExplorePage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-200 disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Trước
                </button>
                <span className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-black">
                  {explorePage} / {exploreTotalPages}
                </span>
                <button
                  disabled={explorePage >= exploreTotalPages}
                  onClick={() => setExplorePage((p) => Math.min(exploreTotalPages, p + 1))}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-200 disabled:opacity-40 flex items-center gap-1"
                >
                  Tiếp <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ============================================================================
  // 3. HOME TAB RENDER (NO SLIDER UNDER HEADER + ZERO SCROLLBAR DRAG ROWS)
  // ============================================================================
  const renderHomeTab = () => {
    const activeHero = heroMovies[heroIndex] || FALLBACK_MOVIES[0];

    return (
      <div className="pt-3 pb-8 space-y-6">
        {/* Hero Featured Banner directly below the 1-row Header */}
        {activeHero && (
          <div className="px-4">
            <div className="relative w-full h-[320px] rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
              <img
                src={activeHero.poster_url || activeHero.thumb_url}
                alt={activeHero.name}
                className="w-full h-full object-cover object-center transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-[#090b10]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#090b10]/80 via-transparent to-transparent" />

              <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col justify-end">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white rounded-md flex items-center gap-1">
                    <Flame className="w-3 h-3" /> HOT TRÊN PHIM NOW
                  </span>
                  {activeHero.current_episode && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/15 backdrop-blur-md text-white rounded-md">
                      {activeHero.current_episode}
                    </span>
                  )}
                  {activeHero.quality && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded-md">
                      {activeHero.quality}
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/60 text-zinc-200 rounded-md border border-white/10 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-rose-400" />{' '}
                    {formatViews(getMovieViews(activeHero.slug))} lượt xem
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-white line-clamp-1 drop-shadow">
                  {activeHero.name}
                </h2>
                <p className="text-xs text-zinc-300 line-clamp-1 mb-3">
                  {activeHero.original_name}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openMovieDetail(activeHero.slug, activeHero)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
                  >
                    <Info className="w-4 h-4" /> Thông Tin & Xem Phim
                  </button>
                  <button
                    onClick={() => toggleFavorite(activeHero)}
                    className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border backdrop-blur-md active:scale-95 transition-all ${
                      isMovieFavorite(activeHero.slug)
                        ? 'bg-rose-600/20 border-rose-500 text-rose-400'
                        : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isMovieFavorite(activeHero.slug) ? 'fill-current text-rose-500' : ''
                      }`}
                    />
                    {isMovieFavorite(activeHero.slug) ? 'Đã Lưu' : 'Yêu Thích'}
                  </button>
                </div>

                {heroMovies.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {heroMovies.map((m, idx) => (
                      <button
                        key={m.slug}
                        onClick={() => setHeroIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === heroIndex ? 'w-6 bg-rose-500' : 'w-1.5 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Continue Watching Row (Zero Scrollbar Drag Row) */}
        {historyList.length > 0 && (
          <section className="space-y-2.5">
            <div className="px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold text-white">Tiếp tục xem gần đây</h2>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-0.5 font-medium"
              >
                Lịch Sử <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <DragScrollRow className="gap-3 px-4 pb-1">
              {historyList.slice(0, 8).map((item) => (
                <div
                  key={item.slug}
                  onClick={() =>
                    openMovieDetail(item.slug, item, {
                      serverIdx: item.server_idx,
                      episodeIdx: item.episode_idx,
                      episodeName: item.episode_name,
                      openPlayerScreen: true
                    })
                  }
                  className="flex-shrink-0 w-60 bg-zinc-900/90 border border-white/10 rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer hover:border-rose-500/40 transition-all group"
                >
                  <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                    <img
                      src={item.thumb_url}
                      alt={item.name}
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-rose-600/60 transition-colors">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-rose-400 font-semibold mt-0.5 truncate">
                      Đang xem: Tập {item.episode_name}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">{item.server_name}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTimeAgo(item.watchedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </DragScrollRow>
          </section>
        )}

        {/* PHIM ĐỀ XUẤT NHIỀU LƯỢT XEM (TOP 10 TRENDING CAROUSEL) */}
        {mostViewedMovies.length > 0 && (
          <section className="space-y-2.5">
            <div className="px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 fill-current" />
                <h2 className="text-sm font-extrabold text-white">
                  Phim Đề Xuất Nhiều Lượt Xem
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('trending')}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-0.5 font-semibold"
              >
                BXH Top 15 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <DragScrollRow className="gap-3 px-4 pb-1">
              {mostViewedMovies.slice(0, 10).map((movie, idx) => (
                <div key={movie.slug} className="w-32 flex-shrink-0">
                  <MovieCard
                    movie={movie}
                    rankNumber={idx + 1}
                    viewCount={movie.totalViews}
                    onSelect={openMovieDetail}
                    isFavorite={isMovieFavorite(movie.slug)}
                    onToggleFavorite={toggleFavorite}
                  />
                </div>
              ))}
            </DragScrollRow>
          </section>
        )}

        {/* Newly Updated & Categories */}
        {homeLoading ? (
          <div className="px-4 space-y-6">
            {[1, 2].map((row) => (
              <div key={row} className="space-y-3">
                <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="aspect-[2/3] rounded-2xl bg-zinc-900 border border-white/5 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <section className="px-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <h2 className="text-sm font-bold text-white">Phim Mới Cập Nhật</h2>
                </div>
                <button
                  onClick={() => navigateToFilter('danh-sach', 'phim-moi-cap-nhat')}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-0.5 font-medium"
                >
                  Xem thêm <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {homeData.newlyUpdated.slice(0, 9).map((movie) => (
                  <MovieCard
                    key={movie.slug}
                    movie={movie}
                    viewCount={getMovieViews(movie.slug)}
                    onSelect={openMovieDetail}
                    isFavorite={isMovieFavorite(movie.slug)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>

            {[
              { title: 'Phim Bộ Đặc Sắc', slug: 'phim-bo', items: homeData.phimBo, icon: Tv },
              { title: 'Phim Lẻ Chiếu Rạp', slug: 'phim-le', items: homeData.phimLe, icon: Film },
              {
                title: 'Hoạt Hình & Anime',
                slug: 'hoat-hinh',
                items: homeData.hoatHinh,
                icon: Sparkles
              },
              { title: 'TV Shows Giải Trí', slug: 'tv-shows', items: homeData.tvShows, icon: Globe }
            ].map(
              (sec) =>
                sec.items.length > 0 && (
                  <section key={sec.slug} className="space-y-2.5">
                    <div className="px-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <sec.icon className="w-4 h-4 text-rose-500" />
                        <h2 className="text-sm font-bold text-white">{sec.title}</h2>
                      </div>
                      <button
                        onClick={() => navigateToFilter('danh-sach', sec.slug)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-0.5 font-medium"
                      >
                        Tất cả <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <DragScrollRow className="gap-3 px-4 pb-1">
                      {sec.items.slice(0, 10).map((movie) => (
                        <div key={movie.slug} className="w-32 flex-shrink-0">
                          <MovieCard
                            movie={movie}
                            viewCount={getMovieViews(movie.slug)}
                            onSelect={openMovieDetail}
                            isFavorite={isMovieFavorite(movie.slug)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </div>
                      ))}
                    </DragScrollRow>
                  </section>
                )
            )}
          </>
        )}
      </div>
    );
  };

  // ============================================================================
  // 4. DEDICATED TOP TRENDING & RECOMMENDED TAB (activeTab === 'trending')
  // ============================================================================
  const renderTrendingTab = () => (
    <div className="px-4 pt-3 pb-8 space-y-4">
      <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/80 via-zinc-900 to-amber-950/50 border border-rose-500/25 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center text-black shadow-lg shadow-rose-600/30 flex-shrink-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white">
              Phim Đề Xuất Nhiều Lượt Xem
            </h1>
            <p className="text-[11px] text-zinc-300">
              Bảng xếp hạng lượt xem thời gian thực trên Phim Now
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 rounded-xl bg-zinc-950/90 p-1 border border-white/10">
          {[
            { id: 'day', label: 'Top Ngày' },
            { id: 'week', label: 'Top Tuần' },
            { id: 'recommended', label: 'Đề Xuất' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTrendingPeriod(tab.id)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                trendingPeriod === tab.id
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {mostViewedMovies.slice(0, 3).map((movie, idx) => (
          <div
            key={movie.slug}
            onClick={() => openMovieDetail(movie.slug, movie)}
            className="relative overflow-hidden rounded-2xl bg-zinc-900/90 border border-white/10 p-3 flex items-center gap-3 cursor-pointer hover:border-rose-500/50 transition-all group"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                idx === 0
                  ? 'bg-amber-400 text-black'
                  : idx === 1
                  ? 'bg-zinc-200 text-black'
                  : 'bg-amber-700 text-white'
              }`}
            >
              #{idx + 1}
            </div>
            <img
              src={movie.thumb_url}
              alt={movie.name}
              className="w-12 h-16 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-extrabold text-white truncate group-hover:text-rose-400">
                {movie.name}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">{movie.original_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-rose-600/20 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {formatViews(movie.totalViews)} lượt xem
                </span>
                {movie.current_episode && (
                  <span className="text-[10px] text-zinc-400 font-semibold">
                    {movie.current_episode}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-rose-400" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        {mostViewedMovies.map((movie, idx) => (
          <MovieCard
            key={movie.slug}
            movie={movie}
            rankNumber={idx + 1}
            viewCount={movie.totalViews}
            onSelect={openMovieDetail}
            isFavorite={isMovieFavorite(movie.slug)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // 5. DEDICATED WATCH HISTORY PAGE (TRANG LỊCH SỬ XEM PHIM)
  // ============================================================================
  const renderHistoryTab = () => {
    const filteredHistory = historyList.filter(
      (item) =>
        !historySearchQuery.trim() ||
        item.name?.toLowerCase().includes(historySearchQuery.trim().toLowerCase()) ||
        item.original_name?.toLowerCase().includes(historySearchQuery.trim().toLowerCase())
    );

    return (
      <div className="px-4 pt-3 pb-8 space-y-4">
        <div className="flex flex-col gap-3 bg-zinc-900/90 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white">Lịch Sử Xem Phim</h1>
                <p className="text-[11px] text-zinc-400">
                  Đã lưu {historyList.length} phim • Tự động nhớ tập đang xem
                </p>
              </div>
            </div>

            {historyList.length > 0 && !confirmClearHistory && (
              <button
                onClick={() => setConfirmClearHistory(true)}
                className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold"
                title="Xóa toàn bộ lịch sử"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {confirmClearHistory && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <span className="text-xs text-zinc-300">Xóa toàn bộ lịch sử xem?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAllHistory}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold"
                >
                  Xóa hết
                </button>
                <button
                  onClick={() => setConfirmClearHistory(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {historyList.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              placeholder="Lọc phim trong lịch sử đã xem..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
            {historySearchQuery && (
              <button
                onClick={() => setHistorySearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-600">
              <History className="w-7 h-7" />
            </div>
            <h3 className="text-xs font-bold text-zinc-300">
              {historySearchQuery ? 'Không tìm thấy phim nào trong lịch sử' : 'Lịch sử xem trống'}
            </h3>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
              Mỗi khi bạn mở xem một tập phim trên Phim Now, hệ thống sẽ tự động lưu lại vị trí tập tại đây.
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
            >
              Khám Phá Phim Ngay
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredHistory.map((item) => (
              <div
                key={item.slug}
                onClick={() => openMovieDetail(item.slug, item)}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/85 hover:bg-zinc-900 border border-white/10 cursor-pointer transition-all group"
              >
                <div className="relative w-16 h-24 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                  <img
                    src={item.thumb_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-rose-600/60 transition-colors">
                    <Play className="w-5 h-5 text-white fill-current" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded">
                      Tập {item.episode_name}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-300 rounded">
                      {item.server_name}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-rose-400">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate">{item.original_name}</p>
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-rose-500" /> Xem {formatTimeAgo(item.watchedAt)}
                  </p>

                  <div className="pt-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMovieDetail(item.slug, item, {
                          serverIdx: item.server_idx,
                          episodeIdx: item.episode_idx,
                          episodeName: item.episode_name,
                          openPlayerScreen: true
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1 shadow"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Xem tiếp
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMovieDetail(item.slug, item);
                      }}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHistoryItem(item.slug);
                  }}
                  className="p-2 rounded-xl bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors self-start"
                  title="Xóa khỏi lịch sử"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // 5B. FAVORITES TAB RENDER (TỦ PHIM YÊU THÍCH)
  // ============================================================================
  const renderFavoritesTab = () => (
    <div className="px-4 pt-3 pb-8 space-y-4">
      <div className="flex items-center justify-between bg-zinc-900/90 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white">Tủ Phim Yêu Thích</h1>
            <p className="text-[11px] text-zinc-400">
              {favorites.length} bộ phim đã lưu đồng bộ Google Cloud
            </p>
          </div>
        </div>
        {!googleProfile && (
          <button
            onClick={() => setActiveScreen('login')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            Đăng nhập
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="py-14 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-600">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-xs font-bold text-zinc-300">Chưa có phim yêu thích nào</h3>
          <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
            Bấm vào biểu tượng trái tim trên bất kỳ bộ phim nào để lưu vào tủ phim cá nhân của bạn.
          </p>
          <button
            onClick={() => setActiveTab('home')}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
          >
            Tìm Phim Hay Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {favorites.map((movie) => (
            <MovieCard
              key={movie.slug}
              movie={movie}
              viewCount={getMovieViews(movie.slug)}
              onSelect={openMovieDetail}
              isFavorite={true}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ============================================================================
  // 5C. ACCOUNT & SETTINGS TAB RENDER (TÀI KHOẢN GOOGLE & CÀI ĐẶT)
  // ============================================================================
  const renderAccountTab = () => (
    <div className="px-4 pt-3 pb-8 space-y-4">
      <div className="p-4 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-950/40 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <PhimNowLogo size="md" />
          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-zinc-300">
            v2.5 Mobile
          </span>
        </div>

        {googleProfile ? (
          <div className="flex items-center gap-3.5 pt-1">
            <img
              src={googleProfile.photoURL}
              alt={googleProfile.displayName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-500 shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold mb-1">
                <CheckCircle2 className="w-3 h-3" /> Đã đồng bộ Google
              </span>
              <h2 className="text-sm font-black text-white truncate">
                {googleProfile.displayName}
              </h2>
              <p className="text-xs text-zinc-400 truncate">{googleProfile.email}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white">Chế độ Khách (Guest)</h2>
                <p className="text-xs text-zinc-400">
                  Đăng nhập Google để sao lưu Lịch sử & Tủ phim
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleGoogleSignIn}
                className="py-2.5 px-3 rounded-xl bg-white text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow"
              >
                <LogIn className="w-4 h-4 text-rose-600" /> Google Login
              </button>
              <button
                onClick={() => setActiveScreen('login')}
                className="py-2.5 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Trang Đăng Nhập
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
          <div
            onClick={() => setActiveTab('history')}
            className="p-2.5 rounded-2xl bg-zinc-950/70 border border-white/5 cursor-pointer"
          >
            <div className="text-base font-black text-amber-400">{historyList.length}</div>
            <div className="text-[10px] text-zinc-400 font-semibold">Lịch sử xem</div>
          </div>
          <div
            onClick={() => setActiveTab('favorites')}
            className="p-2.5 rounded-2xl bg-zinc-950/70 border border-white/5 cursor-pointer"
          >
            <div className="text-base font-black text-rose-500">{favorites.length}</div>
            <div className="text-[10px] text-zinc-400 font-semibold">Yêu thích</div>
          </div>
          <div
            onClick={() => setActiveTab('trending')}
            className="p-2.5 rounded-2xl bg-zinc-950/70 border border-white/5 cursor-pointer"
          >
            <div className="text-base font-black text-emerald-400">{allComments.length + 3}</div>
            <div className="text-[10px] text-zinc-400 font-semibold">Bình luận</div>
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
          Cài Đặt Trình Phát & Giao Diện
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">Giao diện Hệ điều hành</div>
            <div className="text-[11px] text-zinc-400">Tương thích chuẩn iOS & Android</div>
          </div>
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/10">
            {['ios', 'android'].map((os) => (
              <button
                key={os}
                onClick={() => setOsStyle(os)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                  osStyle === os ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                {os}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <div className="text-xs font-bold text-white">Trình phát mặc định</div>
            <div className="text-[11px] text-zinc-400">Chọn luồng Embed hoặc HLS M3U8</div>
          </div>
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/10">
            {[
              { id: 'embed', label: 'Embed' },
              { id: 'm3u8', label: 'M3U8' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setDefaultPlayerMode(mode.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  defaultPlayerMode === mode.id ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <div className="text-xs font-bold text-white">Tự động lưu lịch sử xem</div>
            <div className="text-[11px] text-zinc-400">Ghi nhớ tập đang xem dở</div>
          </div>
          <button
            onClick={() => setAutoSaveHistory((v) => !v)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
              autoSaveHistory ? 'bg-rose-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoSaveHistory ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {googleProfile && (
        <button
          onClick={handleLogoutGoogle}
          className="w-full py-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-extrabold flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất tài khoản Google
        </button>
      )}
    </div>
  );

  // ============================================================================
  // 6. DEDICATED MOVIE INFO PAGE (TRANG THÔNG TIN PHIM RIÊNG BIỆT)
  // ============================================================================
  const renderMovieInfoPage = () => {
    const isFav = isMovieFavorite(selectedSlug);
    const categoriesList = parseMovieCategories(movieDetail?.category);
    const cleanSynopsis = stripHtmlTags(movieDetail?.description);
    const savedHistory = historyList.find((h) => h.slug === selectedSlug);
    const totalViews = getMovieViews(selectedSlug);

    return (
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8 bg-[#090b10] animate-fadeIn">
        <div className="sticky top-0 z-30 bg-[#090b10]/90 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setActiveScreen('main')}
            className="flex items-center gap-1 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-xs font-extrabold text-white truncate max-w-[55%]">
            Thông Tin Phim
          </span>
          <button
            onClick={() => movieDetail && toggleFavorite(movieDetail)}
            className={`p-2 rounded-xl border transition-all ${
              isFav
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-zinc-900 text-zinc-300 border-white/10'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>

        {detailLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-400">Đang tải thông tin phim trên Phim Now...</p>
          </div>
        ) : detailError || !movieDetail ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-xs text-zinc-300">{detailError || 'Không tìm thấy phim'}</p>
            <button
              onClick={() => setActiveScreen('main')}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
            >
              Về Trang Chủ
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <div className="h-48 w-full overflow-hidden relative bg-zinc-900">
                <img
                  src={movieDetail.poster_url || movieDetail.thumb_url}
                  alt={movieDetail.name}
                  className="w-full h-full object-cover opacity-50 blur-[1px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-[#090b10]/60 to-transparent" />
              </div>

              <div className="px-4 -mt-24 relative z-10 flex items-end gap-3.5">
                <img
                  src={movieDetail.thumb_url || movieDetail.poster_url}
                  alt={movieDetail.name}
                  className="w-24 aspect-[2/3] rounded-2xl object-cover border-2 border-white/15 shadow-2xl flex-shrink-0 bg-zinc-900"
                />
                <div className="flex-1 min-w-0 pb-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {movieDetail.quality && (
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black">
                        {movieDetail.quality}
                      </span>
                    )}
                    {movieDetail.current_episode && (
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                        {movieDetail.current_episode}
                      </span>
                    )}
                  </div>
                  <h1 className="text-base sm:text-lg font-black text-white leading-snug">
                    {movieDetail.name}
                  </h1>
                  <p className="text-xs text-zinc-400 font-medium truncate">
                    {movieDetail.original_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-[11px]">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" /> {averageMovieRating}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-300 font-medium">
                      <Eye className="w-3.5 h-3.5 text-rose-500" /> {formatViews(totalViews)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 flex items-center gap-2.5">
              <button
                onClick={() => handleStartWatchingEpisode(activeServerIdx, activeEpisodeIdx)}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                {savedHistory
                  ? `XEM TIẾP TẬP ${savedHistory.episode_name}`
                  : 'XEM PHIM NGAY'}
              </button>

              <button
                onClick={() => toggleFavorite(movieDetail)}
                className={`py-3 px-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                  isFav
                    ? 'bg-rose-600/20 border-rose-500 text-rose-400'
                    : 'bg-zinc-900 border-white/10 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-rose-500' : ''}`} />
                {isFav ? 'Đã Lưu' : 'Yêu Thích'}
              </button>
            </div>

            <div className="px-4 space-y-4">
              {categoriesList.length > 0 && (
                <DragScrollRow className="gap-1.5">
                  {categoriesList.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/10 text-[11px] font-medium text-zinc-300 whitespace-nowrap shrink-0"
                    >
                      {tag.name}
                    </span>
                  ))}
                </DragScrollRow>
              )}

              <div className="p-3.5 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-400">
                  Nội dung phim
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">{cleanSynopsis}</p>
                <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-zinc-500">Đạo diễn: </span>
                    <span className="text-zinc-200 font-semibold">
                      {movieDetail.director || 'Đang cập nhật'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Diễn viên: </span>
                    <span className="text-zinc-200 font-semibold">
                      {movieDetail.casts || 'Đang cập nhật'}
                    </span>
                  </div>
                </div>
              </div>

              {movieDetail.episodes && movieDetail.episodes.length > 0 && (
                <div className="p-3.5 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                      <Layers className="w-4 h-4 text-rose-500" /> Chọn Server & Tập:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {movieDetail.episodes.map((srv, idx) => (
                        <button
                          key={srv.server_name + idx}
                          onClick={() => {
                            setActiveServerIdx(idx);
                            setActiveEpisodeIdx(0);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                            activeServerIdx === idx
                              ? 'bg-rose-600 text-white shadow'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {srv.server_name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(currentServer?.items?.length || 0) > 12 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={episodeSearch}
                        onChange={(e) => setEpisodeSearch(e.target.value)}
                        placeholder={`Tìm tập phim (Tổng ${currentServer.items.length} tập)...`}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                    {filteredEpisodes.map((ep) => {
                      const isSelected = ep.originalIdx === activeEpisodeIdx;
                      return (
                        <button
                          key={ep.slug || ep.name}
                          onClick={() => handleStartWatchingEpisode(activeServerIdx, ep.originalIdx)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold truncate border transition-all ${
                            isSelected
                              ? 'bg-rose-600 border-rose-400 text-white shadow'
                              : 'bg-zinc-950 border-white/10 text-zinc-300 hover:border-rose-500/50 hover:text-white'
                          }`}
                        >
                          Tập {ep.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {renderCommentsSection()}

              {mostViewedMovies.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-extrabold text-white">
                      Phim Đề Xuất Liên Quan
                    </h3>
                  </div>
                  <DragScrollRow className="gap-3 pb-2">
                    {mostViewedMovies
                      .filter((m) => m.slug !== selectedSlug)
                      .slice(0, 8)
                      .map((movie, idx) => (
                        <div key={movie.slug} className="w-32 flex-shrink-0">
                          <MovieCard
                            movie={movie}
                            rankNumber={idx + 1}
                            viewCount={movie.totalViews}
                            onSelect={openMovieDetail}
                            isFavorite={isMovieFavorite(movie.slug)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </div>
                      ))}
                  </DragScrollRow>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // 7. DEDICATED VIDEO PLAYER SCREEN (TRANG XEM PHIM)
  // ============================================================================
  const renderVideoPlayerScreen = () => {
    const isFav = isMovieFavorite(selectedSlug);

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#090b10] animate-fadeIn">
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#090b10] border-b border-white/10 shrink-0">
          <button
            onClick={() => setActiveScreen('movieInfo')}
            className="flex items-center gap-1 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" /> Thông tin
          </button>
          <div className="text-center max-w-[55%]">
            <div className="text-xs font-extrabold text-white truncate">
              {movieDetail?.name || 'Đang phát phim'}
            </div>
            <div className="text-[10px] text-rose-400 font-semibold">
              Tập {currentEpisode?.name || '1'} • {currentServer?.server_name || 'Vietsub'}
            </div>
          </div>
          <button
            onClick={() => movieDetail && toggleFavorite(movieDetail)}
            className={`p-2 rounded-xl border transition-all ${
              isFav
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-zinc-900 text-zinc-300 border-white/10'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="w-full bg-black relative aspect-video shrink-0 border-b border-white/10">
          {detailLoading || !currentEpisode ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">Đang tải luồng phát Phim Now...</span>
            </div>
          ) : playerType === 'embed' ? (
            <iframe
              key={`${currentEpisode.embed}-${activeServerIdx}-${activeEpisodeIdx}`}
              src={currentEpisode.embed}
              title={`${movieDetail?.name} - Tập ${currentEpisode.name}`}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <HlsVideoPlayer
              key={`${currentEpisode.m3u8}-${activeServerIdx}-${activeEpisodeIdx}`}
              src={currentEpisode.m3u8}
              poster={movieDetail?.poster_url || movieDetail?.thumb_url}
              title={`${movieDetail?.name} - Tập ${currentEpisode.name}`}
            />
          )}
        </div>

        <div className="px-3.5 py-2 bg-zinc-900 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              disabled={activeEpisodeIdx <= 0}
              onClick={() =>
                handleStartWatchingEpisode(activeServerIdx, Math.max(0, activeEpisodeIdx - 1))
              }
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-[11px] font-bold text-zinc-200 flex items-center gap-1 border border-white/10"
            >
              <ChevronLeft className="w-3 h-3" /> Tập trước
            </button>
            <button
              disabled={
                !currentServer?.items || activeEpisodeIdx + 1 >= currentServer.items.length
              }
              onClick={() => handleStartWatchingEpisode(activeServerIdx, activeEpisodeIdx + 1)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-[11px] font-bold text-zinc-200 flex items-center gap-1 border border-white/10"
            >
              Tập tiếp <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setPlayerType('embed')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                playerType === 'embed'
                  ? 'bg-rose-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MonitorPlay className="w-3 h-3" /> Embed
            </button>
            <button
              onClick={() => setPlayerType('m3u8')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                playerType === 'm3u8'
                  ? 'bg-rose-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Video className="w-3 h-3" /> M3U8
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-4 pb-8">
          {movieDetail?.episodes && (
            <div className="p-3.5 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-rose-500" /> Đổi Server / Tập phim:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {movieDetail.episodes.map((srv, idx) => (
                    <button
                      key={srv.server_name + idx}
                      onClick={() => handleStartWatchingEpisode(idx, 0)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        activeServerIdx === idx
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {srv.server_name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                {(currentServer?.items || []).map((ep, idx) => (
                  <button
                    key={ep.slug || ep.name}
                    onClick={() => handleStartWatchingEpisode(activeServerIdx, idx)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold truncate border transition-all ${
                      idx === activeEpisodeIdx
                        ? 'bg-rose-600 border-rose-400 text-white shadow'
                        : 'bg-zinc-950 border-white/10 text-zinc-300 hover:border-rose-500/40'
                    }`}
                  >
                    {ep.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {renderCommentsSection()}
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN SHELL RENDER (100dvh MOBILE CONTAINER + ZERO SCROLLBAR CSS)
  // ============================================================================
  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-zinc-950 text-zinc-100 flex justify-center overflow-hidden select-none">
      {/* Global Zero-Scrollbar CSS Rules for Native Mobile Feel */}
      <style>{`
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          -webkit-overflow-scrolling: touch;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
      `}</style>

      {/* Mobile Viewport Shell: 1-row Header at top, Content in middle, 6-item Menu pinned at bottom */}
      <div className="w-full max-w-[440px] mx-auto h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden relative bg-[#090b10] shadow-2xl border-x border-white/10">
        {/* ====================================================================
            SINGLE-ROW COMPACT HEADER (Logo PHIM NOW + Center Search + Login)
            No horizontal slider underneath, no extra wide gap next to Login
           ==================================================================== */}
        {activeScreen === 'main' && (
          <header className="shrink-0 z-30 bg-[#0d1017]/95 backdrop-blur-xl border-b border-white/10 px-3 py-2.5 flex items-center justify-between gap-2">
            {/* Left: Custom SVG Logo PHIM NOW */}
            <div className="shrink-0">
              <PhimNowLogo size="md" onClick={() => handleBottomTabClick('home')} />
            </div>

            {/* Middle: Compact Inline Search Bar */}
            <div className="flex-1 min-w-0 relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (activeTab !== 'explore') setActiveTab('explore');
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setExplorePage(1);
                  if (activeTab !== 'explore') setActiveTab('explore');
                }}
                placeholder="Tìm phim, diễn viên..."
                className="w-full pl-8 pr-7 py-1.5 rounded-full bg-zinc-900/95 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Flush Google Profile or Compact Login Button */}
            <div className="shrink-0">
              {googleProfile ? (
                <button
                  onClick={() => handleBottomTabClick('account')}
                  className="flex items-center gap-1.5 p-0.5 pr-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10"
                >
                  <img
                    src={googleProfile.photoURL}
                    alt={googleProfile.displayName}
                    className="w-6 h-6 rounded-full object-cover border border-rose-500"
                  />
                  <span className="text-[11px] font-bold text-zinc-200 max-w-[56px] truncate">
                    {googleProfile.displayName.split(' ').pop()}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveScreen('login')}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-md shadow-rose-600/25 active:scale-95 transition-transform"
                >
                  <LogIn className="w-3 h-3" /> Đăng nhập
                </button>
              )}
            </div>
          </header>
        )}

        {/* Active Screen Viewport (Scrollable flex-1 area with hidden scrollbars) */}
        {activeScreen === 'login' ? (
          renderDedicatedLoginScreen()
        ) : activeScreen === 'movieInfo' ? (
          renderMovieInfoPage()
        ) : activeScreen === 'player' ? (
          renderVideoPlayerScreen()
        ) : (
          <main className="flex-1 overflow-y-auto no-scrollbar overscroll-contain">
            {activeTab === 'home' && renderHomeTab()}
            {activeTab === 'explore' && renderExploreTab()}
            {activeTab === 'trending' && renderTrendingTab()}
            {activeTab === 'history' && renderHistoryTab()}
            {activeTab === 'favorites' && renderFavoritesTab()}
            {activeTab === 'account' && renderAccountTab()}
          </main>
        )}

        {/* ====================================================================
            6-ITEM BOTTOM NAVIGATION BAR (MENU DƯỚI CHÂN MÀN HÌNH)
            Always pinned at the bottom of the 100dvh mobile shell
           ==================================================================== */}
        <nav
          aria-label="Menu chính dưới chân màn hình"
          className="shrink-0 bg-[#0d1017]/95 backdrop-blur-2xl border-t border-white/10 px-1 py-1.5 z-50 grid grid-cols-6 gap-0.5 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]"
        >
          {[
            { id: 'home', label: 'Trang Chủ', icon: Home },
            { id: 'explore', label: 'Danh Mục', icon: LayoutGrid },
            { id: 'trending', label: 'Top Xem', icon: Flame, hot: true },
            { id: 'history', label: 'Lịch Sử', icon: History, badge: historyList.length },
            { id: 'favorites', label: 'Tủ Phim', icon: Heart, badge: favorites.length },
            { id: 'account', label: 'Tài Khoản', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeScreen === 'main' && activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleBottomTabClick(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all active:scale-95 ${
                  isActive ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div
                  className={`relative p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-rose-600/20 text-rose-500 shadow-sm shadow-rose-600/20' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  {tab.hot && !isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[15px] h-3.5 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] leading-tight mt-0.5 truncate max-w-full ${
                    isActive ? 'font-extrabold text-rose-400' : 'font-semibold'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && <span className="w-4 h-0.5 rounded-full bg-rose-500 mt-0.5" />}
              </button>
            );
          })}
        </nav>

        {/* Quick Google Login Prompt Modal */}
        {showLoginPromptModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-white/15 p-5 space-y-4 shadow-2xl text-center">
              <div className="flex justify-center">
                <PhimNowLogo size="lg" />
              </div>
              <h3 className="text-base font-extrabold text-white">Cần Đăng Nhập Google</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {loginPromptReason ||
                  'Đăng nhập bằng tài khoản Google để đồng bộ dữ liệu cá nhân của bạn trên Phim Now.'}
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  Đăng nhập nhanh bằng Google
                </button>
                <button
                  onClick={() => {
                    setShowLoginPromptModal(false);
                    setActiveScreen('login');
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-600/20 text-rose-400 font-bold text-xs"
                >
                  Mở Trang Đăng Nhập Đầy Đủ
                </button>
                <button
                  onClick={() => setShowLoginPromptModal(false)}
                  className="w-full py-2 rounded-xl text-zinc-400 text-xs font-semibold"
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Google Sign-In Sandbox Link Modal */}
        {showGoogleSimModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-white/15 p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Đăng nhập Tài khoản Google</h3>
                    <p className="text-[11px] text-zinc-400">Đồng bộ Phim Now Cloud</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoogleSimModal(false)}
                  className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmSimulatedGoogle} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Tên hiển thị Google
                  </label>
                  <input
                    type="text"
                    required
                    value={simNameInput}
                    onChange={(e) => setSimNameInput(e.target.value)}
                    placeholder="Nguyễn Minh Quân"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Địa chỉ Gmail
                  </label>
                  <input
                    type="email"
                    required
                    value={simEmailInput}
                    onChange={(e) => setSimEmailInput(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleSimModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
                  >
                    Xác nhận Đăng nhập
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-white/15 text-white text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}