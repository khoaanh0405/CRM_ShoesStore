# CRM ShoesStore — Customer Web (thay cho mobile/Expo)

Web app cho khách hàng (mục 4.3 Yeu_cau_do_an.docx), viết bằng Vite + React + TypeScript,
chuyển đổi 1-1 logic/nghiệp vụ từ bản mobile Expo (giữ nguyên services/, types/, constants/,
hooks/, utils/ — chỉ đổi phần UI React Native -> HTML/CSS và SecureStore -> localStorage).

## Chạy thử
```bash
cp .env.example .env   # sửa VITE_API_URL trỏ tới backend/ đang chạy
npm install
npm run dev             # http://localhost:5174
```

## Build production
```bash
npm run build   # xuất ra dist/
npm run preview
```

## Cấu trúc
- `src/services/` — gọi API backend (giống hệt endpoint bản mobile).
- `src/context/AuthContext.tsx` — quản lý phiên đăng nhập bằng localStorage.
- `src/pages/` — Login, Register, Home, Products, ProductDetail, Surveys, SurveyForm,
  Feedbacks, FeedbackCreate, Profile, Notifications.
- `src/components/TabBar.tsx` — thanh điều hướng dưới cùng (thay cho Tabs của expo-router).
- `src/components/AuthGate.tsx` — route guard đăng nhập/đăng xuất (thay AuthGate mobile).

## Khác biệt so với bản mobile
- SecureStore -> `localStorage` (token + account).
- expo-router (`useRouter`, `Link`, file-based routing) -> `react-router-dom`
  (`useNavigate`, `Link`, khai báo route trong `src/App.tsx`).
- `View/Text/Pressable/TextInput/FlatList/Image` -> `div/span/button/input/map/img`.
- `@expo/vector-icons` (Ionicons) -> `lucide-react`.
- `useFocusEffect` (expo-router) -> lắng nghe sự kiện `focus` của trình duyệt trong `useApi`.
- Alert.alert -> `alert()`/`confirm()` (đơn giản hoá cho web; có thể thay bằng toast/modal riêng).
