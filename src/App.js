/* eslint-disable no-unused-vars */
/* v6-schedule-drive-adjust */
import { useState, useRef, useCallback, useEffect } from "react";

const AGENCY_DEFAULT = "Blue Sky Corporation";

const BRAND_TONES = {
  fmcg:       "FMCG / Tiêu dùng – vui tươi, gần gũi, đời thường, phù hợp người tiêu dùng đại chúng",
  corporate:  "Doanh nghiệp B2B – chuyên nghiệp, trang trọng, số liệu rõ ràng",
  luxury:     "Luxury – sang trọng, tinh tế, ngôn ngữ chọn lọc, cảm xúc cao",
  tech:       "Công nghệ – hiện đại, sáng tạo, ngắn gọn, dữ liệu thực tế",
  event:      "Sự kiện / Event – sôi động, hào hứng, kêu gọi hành động mạnh",
  realestate: "Bất động sản – uy tín, khát vọng, đầu tư dài hạn, tầm nhìn",
};

const ADJUST_BTNS = [
  { key: "shorter",    label: "⬇ Ngắn hơn",      color: "#5c6bc0" },
  { key: "impressive", label: "🔥 Ấn tượng hơn",  color: "#e65100" },
  { key: "serious",    label: "🎯 Nghiêm túc hơn", color: "#37474f" },
];

const ALL_DAYS = ["Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy","Chủ Nhật"];
const FIXED_DAYS = ["Thứ Hai","Thứ Tư","Thứ Sáu","Thứ Bảy","Chủ Nhật"];
const GOLDEN_TIMES = ["08:00","12:00","17:30","20:00","21:00"];
const OPTIMAL_TIMES = ["07:00","08:00","09:00","11:00","12:00","13:00","17:00","17:30","19:00","20:00","21:00"];
const CAPTION_LABELS = { hook:"🎣 Hook", story:"📖 Câu chuyện", cta:"📣 Call-to-Action", short:"⚡ Ngắn gọn" };

const STEPS = [
  { id:"source",   icon:"📂", label:"Nguồn ảnh" },
  { id:"caption",  icon:"🤖", label:"AI Caption" },
  { id:"edit",     icon:"✏️",  label:"Chỉnh sửa" },
  { id:"schedule", icon:"📅", label:"Lịch đăng" },
  { id:"publish",  icon:"🚀", label:"Đăng bài" },
];

function randomSlot() {
  return { day: FIXED_DAYS[Math.floor(Math.random()*FIXED_DAYS.length)], time: GOLDEN_TIMES[Math.floor(Math.random()*GOLDEN_TIMES.length)] };
}

function getNextDate(dayLabel) {
  const map={"Thứ Hai":1,"Thứ Ba":2,"Thứ Tư":3,"Thứ Năm":4,"Thứ Sáu":5,"Thứ Bảy":6,"Chủ Nhật":0};
  const target=map[dayLabel]??1, now=new Date();
  const diff=(target-now.getDay()+7)%7||7;
  const d=new Date(now); d.setDate(now.getDate()+diff); return d;
}

function guessInfo(name) {
  return {
    brand: name.split(/\s+/).slice(0,2).join(" "),
    program: name,
    objective: "",
    kpi: "",
    region: "TP. Hồ Chí Minh",
    agency: localStorage.getItem("agency_name") || AGENCY_DEFAULT,
    note: "",
  };
}

async function adjustCaption(currentCaption, direction, groqKey) {
  const dirMap = {
    shorter:    "Viết lại NGẮN HƠN 30-40%, giữ nguyên thông tin quan trọng và hashtags.",
    longer:     "Viết lại DÀI HƠN 40-50%, thêm chi tiết cảm xúc, bối cảnh và storytelling.",
    impressive: "Viết lại ẤN TƯỢNG HƠN: mạnh hơn, táo bạo hơn, hook mạnh hơn, cảm xúc cao hơn.",
    serious:    "Viết lại NGHIÊM TÚC HƠN: trang trọng, chuyên nghiệp, B2B tone, bỏ emoji vui.",
    fun:        "Viết lại VUI HƠN: thêm emoji, ngôn ngữ trẻ trung, gần gũi, năng động.",
    complete:   "Viết lại ĐẦY ĐỦ HƠN: bổ sung thêm thông tin brand, kết quả, địa điểm.",
  };
  const prompt = `Bạn là senior copywriter agency BTL Việt Nam.\n\nCaption hiện tại:\n"${currentCaption}"\n\nYêu cầu: ${dirMap[direction]}\n\nGiữ nguyên: thông tin brand, tên chương trình, KPI, khu vực, hashtags.\nTrả về CHỈ caption mới, KHÔNG giải thích, KHÔNG markdown.`;
  try {
    const key = groqKey || localStorage.getItem("groq_key") || "";
    if (!key) throw new Error("no key");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body:JSON.stringify({model:"llama-3.1-8b-instant",messages:[{role:"user",content:prompt}],max_tokens:1200}),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || currentCaption;
  } catch { return currentCaption; }
}

async function genCaptions(projectName, tone="event", groqKey="", info={}) {
  const toneDesc = BRAND_TONES[tone] || BRAND_TONES.event;
  const agency = info.agency || AGENCY_DEFAULT;
  const infoBlock = `
- Brand/Khách hàng: ${info.brand||"chưa rõ"}
- Tên chương trình: ${info.program||projectName}
- Mục tiêu chiến dịch: ${info.objective||"tăng nhận diện thương hiệu"}
- KPI đạt được: ${info.kpi||"chưa cập nhật"}
- Khu vực: ${info.region||"TP. Hồ Chí Minh"}
- Agency thực hiện: ${agency}
- Ghi chú: ${info.note||""}`;

  const prompt = `Bạn là senior copywriter của ${agency} — agency sự kiện & BTL hàng đầu Việt Nam.

Thông tin dự án:${infoBlock}
Phong cách viết: ${toneDesc}

YÊU CẦU QUAN TRỌNG:
- Đề cập CỤ THỂ: tên brand, tên chương trình, khu vực, KPI/kết quả thực tế
- Viết phù hợp với ĐỐI TƯỢNG KHÁCH HÀNG của nhãn hàng (tone: ${toneDesc})
- Thể hiện năng lực và sự chuyên nghiệp của ${agency}
- KHÔNG viết chung chung — phải có số liệu/địa điểm/tên cụ thể

Tạo 4 caption Facebook:

1. "hook" – 2-3 câu mở đầu cực mạnh, gây tò mò hoặc shock, kết quả nổi bật nhất, emoji phù hợp tone

2. "story" – 10-14 câu đầy đủ ngữ cảnh: mô tả bối cảnh brief ban đầu → thách thức → ý tưởng sáng tạo → quá trình thực thi → kết quả cụ thể (số liệu, KPI) → cảm xúc/phản hồi từ khách hàng/người tham dự. Phải có: mục tiêu ban đầu, KPI đạt được, thông tin liên quan đến nhãn hàng

3. "cta" – 5-6 câu: highlight thành tích cụ thể + điểm mạnh agency + kêu gọi hợp tác rõ ràng

4. "short" – 2-3 câu súc tích + 6-8 hashtags liên quan brand/ngành/khu vực

Hashtags ở tất cả 4 loại caption. JSON duy nhất KHÔNG markdown:
{"hook":"...","story":"...","cta":"...","short":"..."}`;

  try {
    const key = groqKey || localStorage.getItem("groq_key") || "";
    if (!key) throw new Error("no key");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body:JSON.stringify({model:"llama-3.1-8b-instant",messages:[{role:"user",content:prompt}],max_tokens:2500}),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    return JSON.parse(text.replace(/```json|```/g,"").trim());
  } catch {
    const tag=(info.brand||projectName).replace(/\s+/g,"");
    return {
      hook:`🔥 ${info.brand||projectName} x ${agency} – ${info.kpi||"Kết quả ấn tượng"} tại ${info.region||"HCMC"}!\n\n#${tag} #BlueSkyCorporation #EventVietnam`,
      story:`✨ ${info.program||projectName} – Hành trình từ brief đến thực thi...\n\nMục tiêu: ${info.objective||"Tăng nhận diện thương hiệu"}\nKPI: ${info.kpi||"500+ lượt tương tác"}\n\nKhi ${info.brand||"khách hàng"} tin tưởng giao phó, ${agency} không chỉ tổ chức sự kiện — chúng tôi tạo ra trải nghiệm.\n\n📍 ${info.region||"TP. HCM"}\n\n#${tag} #BlueSkyCorporation #EventMarketing`,
      cta:`📣 ${info.program||projectName} đã hoàn thành xuất sắc!\n\n✅ ${info.kpi||"KPI vượt mục tiêu"}\n📍 ${info.region||"TP. HCM"}\n🤝 Bởi ${agency}\n\n👉 Bạn cần agency cho chiến dịch tiếp theo? Liên hệ ngay!\n\n#${tag} #BlueSkyCorporation #EventAgency`,
      short:`🎉 ${info.program||projectName} – Done! ${info.kpi||""} 🙌\n\n#${tag} #BlueSkyCorporation #BTLVietnam`,
    };
  }
}

const INFO_FIELDS = [
  {key:"brand",     label:"Brand / Khách hàng",   placeholder:"VD: Dove, Abbott, Solaria Rise"},
  {key:"program",   label:"Tên chương trình",      placeholder:"VD: Dove Summer Activation 2026"},
  {key:"objective", label:"Mục tiêu chiến dịch",   placeholder:"VD: Tăng nhận diện\n- Sampling 5000 người\n- Tăng độ phủ tại HCM", multiline:true},
  {key:"kpi",       label:"KPI đạt được",          placeholder:"VD: 3,200 lượt tương tác, 150 leads"},
  {key:"region",    label:"Khu vực thực hiện",     placeholder:"VD: TP. HCM, Hà Nội, 5 tỉnh miền Nam"},
  {key:"agency",    label:"Agency thực hiện",      placeholder:"VD: Blue Sky Corporation"},
  {key:"note",      label:"Ghi chú thêm",          placeholder:"VD: Kết hợp KOL, livestream, booth 50m²"},
];

export default function App() {
  const [step, setStep] = useState(0);
  const [sourceType, setSourceType] = useState("local");
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedProj, setExpandedProj] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState({});
  const [scheduleEdit, setScheduleEdit] = useState(null);
  const [pendingSchedule, setPendingSchedule] = useState({});
  const [groqKey, setGroqKey] = useState(()=>localStorage.getItem("groq_key")||"")

  useEffect(()=>{
    if(!localStorage.getItem("gdrive_folder_id")) localStorage.setItem("gdrive_folder_id","1oxxpjvAdQxe0pRYwFbPxoSDFnUQpyCRf");
    if(!localStorage.getItem("fb_page_url")) localStorage.setItem("fb_page_url","https://www.facebook.com/BlueSkyCorporation.BelowTheLine.Agency");
    if(!localStorage.getItem("agency_name")) localStorage.setItem("agency_name","Blue Sky Corporation");
  },[]);

  const [fbPageId, setFbPageId] = useState(()=>localStorage.getItem("fb_page_id")||"");
  const [fbPageToken, setFbPageToken] = useState(()=>localStorage.getItem("fb_page_token")||"");
  const [fbPageUrl, setFbPageUrl] = useState(()=>localStorage.getItem("fb_page_url")||"https://www.facebook.com/BlueSkyCorporation.BelowTheLine.Agency");
  const [agencyName, setAgencyName] = useState(()=>localStorage.getItem("agency_name")||AGENCY_DEFAULT);
  const fileInputRef = useRef();

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  // ✅ HÀM ĐẶT GIỜ TÙY CHỈNH — sửa lỗi nút cũ không bỏ highlight
  const applyCustomTime = (projId) => {
    const val = customTimeInput[projId];
    if (!val) { showToast("Chưa nhập giờ!","err"); return; }
    // Cập nhật time của project — vì time không còn trùng GOLDEN_TIMES nên tất cả nút cũ tự bỏ highlight
    updateProj(projId, { time: val });
    showToast("⏰ Đã đặt giờ: " + val);
  };

  const handleToneChange = async (projId, newTone) => {
    updateProj(projId, {tone: newTone});
    const proj = projects.find(p=>p.id===projId);
    if (!proj) return;
    setLoading(true);
    const caps = await genCaptions(proj.name, newTone, groqKey, proj.info||guessInfo(proj.name));
    setLoading(false);
    updateProj(projId, {tone: newTone, captions: caps, customCaption: caps[proj.activeCaption]||caps.hook});
    showToast("🎨 Đã đổi giọng văn & cập nhật caption!");
  };

  const handleFolder = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    const map = {};
    files.forEach(f => {
      if (!f.type.startsWith("image/")) return;
      const parts = f.webkitRelativePath.split("/");
      const proj = parts.length>=2 ? parts[parts.length-2] : "Dự án";
      if (!map[proj]) map[proj]=[];
      map[proj].push(f);
    });
    const newProjs = await Promise.all(Object.entries(map).map(async ([name, imgs]) => {
      const displayImgs = imgs.slice(0,20).map(f=>({file:f,url:URL.createObjectURL(f),selected:false}));
      const autoSelect = Math.min(displayImgs.length,15);
      displayImgs.slice(0,autoSelect).forEach(i=>{i.selected=true;});
      const info = guessInfo(name);
      info.agency = agencyName;
      const captions = await genCaptions(name,"event",groqKey,info);
      const slot = randomSlot();
      return {id:Date.now()+Math.random(),name,tone:"event",images:displayImgs,captions,info,channels:{facebook:1},activeCaption:"hook",customCaption:captions.hook,day:slot.day,time:slot.time,approved:false};
    }));
    setProjects(prev=>[...prev,...newProjs]);
    setExpandedProj(newProjs[0]?.id||null);
    setLoading(false);
    showToast("✅ Đã quét "+newProjs.length+" dự án!");
    setStep(1);
  }, [groqKey, agencyName]);

  const updateProj = (id,patch) => setProjects(prev=>prev.map(p=>p.id===id?{...p,...patch}:p));
  const updatePost = (id,patch) => setPosts(prev=>prev.map(p=>p.id===id?{...p,...patch}:p));

  const regenCaptions = async (proj) => {
    setLoading(true);
    const caps = await genCaptions(proj.name, proj.tone, groqKey, proj.info||guessInfo(proj.name));
    setLoading(false);
    updateProj(proj.id, {captions:caps, customCaption:caps[proj.activeCaption]||caps.hook});
    showToast("🤖 Đã tạo lại caption!");
  };

  const toggleImg = (projId,idx) => {
    setProjects(prev=>prev.map(p=>{
      if(p.id!==projId) return p;
      const imgs=[...p.images]; imgs[idx]={...imgs[idx],selected:!imgs[idx].selected};
      return {...p,images:imgs};
    }));
  };

  const approvePost = (proj) => {
    const selected = proj.images.filter(i=>i.selected);
    if (!selected.length) { showToast("Chọn ít nhất 1 ảnh!","err"); return; }
    const d=getNextDate(proj.day);
    const [h,m]=proj.time.split(":").map(Number); d.setHours(h,m,0,0);
    const post={...proj,id:Date.now()+Math.random(),projId:proj.id,scheduledDate:d,images:selected,posted:false};
    setPosts(prev=>[...prev.filter(p=>p.projId!==proj.id),post]);
    updateProj(proj.id,{approved:true});
    showToast("📅 Đã duyệt! "+proj.day+" "+proj.time);
  };

  // ✅ SỬA approveAll — đếm đúng số bài chưa duyệt
  const approveAll = () => {
    const unapproved = projects.filter(p=>!p.approved);
    if (!unapproved.length) { showToast("Tất cả đã được duyệt!","ok"); return; }
    let count = 0;
    unapproved.forEach(proj=>{
      const selected = proj.images.filter(i=>i.selected);
      if (!selected.length) return;
      const d=getNextDate(proj.day);
      const [h,m]=proj.time.split(":").map(Number); d.setHours(h,m,0,0);
      const post={...proj,id:Date.now()+Math.random(),projId:proj.id,scheduledDate:d,images:selected,posted:false};
      setPosts(prev=>[...prev.filter(p=>p.projId!==proj.id),post]);
      updateProj(proj.id,{approved:true});
      count++;
    });
    showToast("✅ Đã duyệt "+count+" dự án!");
  };

  const uploadPhotoToFB = async (imageFile, imageUrl, token, pageId) => {
    if (imageFile) {
      const formData = new FormData();
      formData.append("source", imageFile);
      formData.append("published", "false");
      formData.append("access_token", token);
      const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.id) return data.id;
      throw new Error(data.error?.message || "Upload ảnh thất bại");
    }
    const params = new URLSearchParams({
      url: imageUrl,
      published: "false",
      access_token: token,
    });
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: "POST",
      body: params,
    });
    const data = await res.json();
    if (data.id) return data.id;
    throw new Error(data.error?.message || "Upload ảnh URL thất bại");
  };

  const doPublish = async (post, isNow = false) => {
    if (!fbPageToken) { showToast("Chưa cấu hình Facebook Token!", "err"); return; }
    const pageId = fbPageId || "me";
    setLoading(true);
    try {
      showToast("⏳ Đang upload " + post.images.length + " ảnh...");
      const photoIds = [];
      for (const img of post.images) {
        const id = await uploadPhotoToFB(img.file || null, img.url, fbPageToken, pageId);
        photoIds.push(id);
      }
      const body = new URLSearchParams();
      body.append("message", post.customCaption);
      body.append("access_token", fbPageToken);
      photoIds.forEach(id => body.append("attached_media[]", JSON.stringify({ media_fbid: id })));
      const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (data.id) {
        updatePost(post.id, { fbPostId: data.id, posted: true });
        showToast(isNow ? "⚡ Đã đăng ngay lên Facebook!" : "🚀 Đã đăng lên Facebook!");
      } else {
        showToast("FB lỗi: " + (data.error?.message || "Không rõ"), "err");
      }
    } catch (e) {
      showToast("Lỗi: " + e.message, "err");
    }
    setLoading(false);
  };

  const publishPost = async (post) => doPublish(post, false);
  const publishNow  = async (post) => doPublish(post, true);

  const pendingCount = projects.filter(p=>!p.approved).length;
  const approvedCount = projects.filter(p=>p.approved).length;
  const postedCount = posts.filter(p=>p.posted).length;

  // ✅ COMPONENT GIỜ ĐĂNG — dùng chung cho bước 2 và bước 3
  const TimePickerRow = ({ proj }) => (
    <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
      {GOLDEN_TIMES.map(t=>(
        <button key={t}
          style={{
            ...s.dayChip,
            // ✅ CHỈ highlight nếu time khớp VÀ không có giờ tùy chỉnh đang được set
            ...(proj.time===t ? s.dayChipActive : {})
          }}
          onClick={()=>{
            // ✅ Khi bấm nút giờ cố định: xóa customTimeInput để ô nhập trống
            setCustomTimeInput(prev=>({...prev,[proj.id]:""}));
            updateProj(proj.id,{time:t});
          }}>
          {t}
        </button>
      ))}
      {/* Ô nhập giờ tùy chỉnh */}
      <div style={{display:"flex",alignItems:"center",gap:4,
        border: !GOLDEN_TIMES.includes(proj.time) && proj.time ? "2px solid #1565c0" : "1px solid #ddd",
        borderRadius:8, padding:"2px 6px", background: !GOLDEN_TIMES.includes(proj.time) && proj.time ? "#e3f2fd" : "#fff"
      }}>
        <input type="time" style={{border:"none",outline:"none",fontSize:12,padding:"2px",background:"transparent",width:90}}
          value={customTimeInput[proj.id] ?? (GOLDEN_TIMES.includes(proj.time) ? "" : proj.time)}
          onChange={e=>setCustomTimeInput(prev=>({...prev,[proj.id]:e.target.value}))}
        />
        <button style={{...s.btnXs,background:"#e3f2fd",color:"#1565c0",fontSize:11,border:"none",padding:"3px 8px"}}
          onClick={()=>applyCustomTime(proj.id)}>
          ⏰ Giờ khác
        </button>
      </div>
      {/* Nút đăng ngay */}
      <button style={{...s.dayChip,background:"#e65100",color:"#fff",borderColor:"#e65100",fontWeight:700}}
        onClick={()=>{
          const now=new Date();
          const hm=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
          setCustomTimeInput(prev=>({...prev,[proj.id]:""}));
          updateProj(proj.id,{time:hm,day:ALL_DAYS[now.getDay()===0?6:now.getDay()-1]});
          showToast("⚡ Đặt giờ hiện tại: "+hm);
        }}>
        ⚡ Ngay bây giờ
      </button>
      {/* Hiển thị giờ đang chọn nếu là giờ tùy chỉnh */}
      {!GOLDEN_TIMES.includes(proj.time) && proj.time && (
        <span style={{fontSize:11,color:"#1565c0",fontWeight:700,background:"#e3f2fd",borderRadius:8,padding:"3px 10px"}}>
          ✅ Đã chọn: {proj.time}
        </span>
      )}
    </div>
  );

  return (
    <div style={s.root}>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <span style={s.brand}>📸 {agencyName}</span>
          {projects.length>0&&(
            <div style={s.navStats}>
              <span style={s.statChip}>{projects.length} dự án</span>
              {pendingCount>0&&<span style={{...s.statChip,background:"#fff3e0",color:"#e65100"}}>{pendingCount} chờ duyệt</span>}
              {approvedCount>0&&<span style={{...s.statChip,background:"#e8f5e9",color:"#2e7d32"}}>{approvedCount} đã duyệt</span>}
              {postedCount>0&&<span style={{...s.statChip,background:"#e3f2fd",color:"#1565c0"}}>{postedCount} đã đăng</span>}
            </div>
          )}
        </div>
        <button style={s.settingsBtn} onClick={()=>setSettingsOpen(true)}>⚙️ Cài đặt</button>
      </nav>

      {/* PROGRESS BAR */}
      <div style={s.progressBar}>
        {STEPS.map((st,i)=>(
          <div key={st.id} style={s.progressItem} onClick={()=>projects.length>0||i===0?setStep(i):null}>
            <div style={{...s.progressDot,background:i<step?"#2e7d32":i===step?"#1565c0":"#e0e0e0",color:i<=step?"#fff":"#999",cursor:projects.length>0||i===0?"pointer":"default"}}>
              {i<step?"✓":st.icon}
            </div>
            <span style={{...s.progressLabel,color:i===step?"#1565c0":i<step?"#2e7d32":"#999",fontWeight:i===step?700:400}}>{st.label}</span>
            {i<STEPS.length-1&&<div style={{...s.progressLine,background:i<step?"#2e7d32":"#e0e0e0"}}/>}
          </div>
        ))}
      </div>

      <div style={s.page}>

        {/* ── BƯỚC 0: NGUỒN ẢNH ── */}
        {step===0&&(
          <div style={s.center}>
            <div style={s.heroBox}>
              <div style={{fontSize:56,marginBottom:16}}>📂</div>
              <h1 style={s.heroTitle}>Kết nối nguồn ảnh</h1>
              <p style={s.heroSub}>Chọn nguồn ảnh – AI tự động viết caption và lên lịch đăng</p>

              <div style={s.toggle}>
                <button style={{...s.toggleBtn,...(sourceType==="local"?s.toggleActive:{})}} onClick={()=>setSourceType("local")}>💻 Folder máy tính</button>
                <button style={{...s.toggleBtn,...(sourceType==="drive"?s.toggleActive:{})}} onClick={()=>setSourceType("drive")}>☁️ Google Drive</button>
              </div>

              {sourceType==="local"?(
                <>
                  <input ref={fileInputRef} type="file" webkitdirectory="true" multiple onChange={handleFolder} style={{display:"none"}}/>
                  <div style={s.dropZone} onClick={()=>fileInputRef.current.click()}>
                    <div style={{fontSize:40,marginBottom:8}}>🗂</div>
                    <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Click hoặc kéo thả folder dự án vào đây</div>
                    <div style={{color:"#888",fontSize:13,marginBottom:16}}>Hỗ trợ JPG, PNG, WebP • Tự nhận diện tên dự án từ tên folder</div>
                    <button style={s.btnPrimary}>📂 Chọn Folder từ máy tính</button>
                  </div>
                  <p style={{fontSize:12,color:"#888",marginTop:8}}>✅ Miễn phí – không cần API, chạy ngay trên máy</p>
                </>
              ):(
                <div style={{border:"1px solid #e0e0e0",borderRadius:12,padding:24,textAlign:"left"}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4,color:"#1565c0"}}>☁️ Kết nối Google Drive</div>
                  <div style={{fontSize:12,color:"#e65100",marginBottom:12,fontWeight:600}}>⚠️ Lưu ý: Cách này dùng Google Drive API miễn phí, cần làm đúng theo từng bước</div>
                  <div style={{background:"#f0f4ff",borderRadius:8,padding:14,fontSize:13,marginBottom:12}}>
                    <div style={{fontWeight:700,marginBottom:8,color:"#1565c0"}}>📋 BƯỚC 1 — Chia sẻ folder Google Drive</div>
                    <ol style={{paddingLeft:18,lineHeight:2.2,margin:0}}>
                      <li>Mở <b>drive.google.com</b></li>
                      <li>Chuột phải vào folder ảnh → chọn <b>"Chia sẻ"</b></li>
                      <li>Bấm <b>"Thay đổi thành bất kỳ ai có đường liên kết"</b></li>
                      <li>Copy link → dán vào ô bên dưới</li>
                    </ol>
                  </div>
                  <div style={{background:"#e8f5e9",borderRadius:8,padding:14,fontSize:13,marginBottom:12}}>
                    <div style={{fontWeight:700,marginBottom:8,color:"#2e7d32"}}>🔑 BƯỚC 2 — Lấy Google API Key (miễn phí)</div>
                    <ol style={{paddingLeft:18,lineHeight:2.2,margin:0}}>
                      <li>Vào <b>console.cloud.google.com</b></li>
                      <li>Tạo project mới → tìm <b>"Google Drive API"</b> → bấm <b>Enable</b></li>
                      <li>Vào <b>Credentials</b> → <b>Create Credentials</b> → chọn <b>API Key</b></li>
                      <li>Copy API Key → dán vào ô bên dưới</li>
                    </ol>
                    <div style={{marginTop:8,fontSize:11,color:"#555"}}>✅ Miễn phí hoàn toàn — Google Drive API free tier: 1 tỷ requests/ngày</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                    <div>
                      <label style={s.fieldLabel}>Link Google Drive Folder</label>
                      <input style={s.inp} placeholder="https://drive.google.com/drive/folders/ABC123..."
                        onChange={e=>{
                          const match=e.target.value.match(/folders\/([a-zA-Z0-9_-]+)/);
                          if(match) localStorage.setItem("gdrive_folder_id", match[1]);
                        }}
                        defaultValue={localStorage.getItem("gdrive_folder_id")?`https://drive.google.com/drive/folders/${localStorage.getItem("gdrive_folder_id")}`:""} 
                      />
                    </div>
                    <div>
                      <label style={s.fieldLabel}>Google API Key</label>
                      <input style={s.inp} type="password" placeholder="AIzaSy..."
                        onChange={e=>localStorage.setItem("google_api_key", e.target.value)}
                        defaultValue={localStorage.getItem("google_api_key")||""}
                      />
                    </div>
                  </div>
                  <button style={{...s.btnPrimary,background:"#4285f4",width:"100%"}} onClick={async()=>{
                    const folderId = localStorage.getItem("gdrive_folder_id");
                    const apiKey = localStorage.getItem("google_api_key");
                    if(!folderId||!apiKey){showToast("Chưa nhập link folder hoặc API Key!","err");return;}
                    try{
                      const res=await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&key=${apiKey}&fields=files(id,name,mimeType)&pageSize=50`);
                      const data=await res.json();
                      if(data.error){showToast("Lỗi: "+data.error.message,"err");return;}
                      if(!data.files||data.files.length===0){showToast("Không tìm thấy ảnh trong folder này","err");return;}
                      showToast(`✅ Tìm thấy ${data.files.length} ảnh! Đang load...`);
                      const imgs = data.files.map(f=>({
                        file:null,
                        url:`https://drive.google.com/thumbnail?id=${f.id}&sz=w400`,
                        driveId:f.id,
                        name:f.name,
                        selected:false
                      }));
                      const autoSelect=Math.min(imgs.length,15);
                      imgs.slice(0,autoSelect).forEach(i=>{i.selected=true;});
                      const info=guessInfo(folderId);
                      info.agency=agencyName;
                      const captions=await genCaptions(folderId,"event",groqKey,info);
                      const slot=randomSlot();
                      const newProj={id:Date.now()+Math.random(),name:"Google Drive - "+new Date().toLocaleDateString("vi-VN"),tone:"event",images:imgs,captions,info,channels:{facebook:1},activeCaption:"hook",customCaption:captions.hook,day:slot.day,time:slot.time,approved:false};
                      setProjects(prev=>[...prev,newProj]);
                      setExpandedProj(newProj.id);
                      setStep(1);
                    }catch(e){showToast("Lỗi kết nối: "+e.message,"err");}
                  }}>
                    🔗 Kết nối & Load ảnh từ Google Drive
                  </button>
                </div>
              )}

              <div style={s.flowRow}>
                {["📁 Chọn nguồn","🤖 AI caption","✏️ Chỉnh sửa","📅 Lên lịch","🚀 Đăng FB"].map((t,i,a)=>(
                  <span key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={s.flowChip}>{t}</span>
                    {i<a.length-1&&<span style={{color:"#bbb"}}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BƯỚC 1: AI CAPTION ── */}
        {step===1&&(
          <div>
            <div style={s.stepHeader}>
              <div>
                <h2 style={s.h2}>🤖 AI Caption — Xem & Chọn nhanh</h2>
                <p style={{color:"#888",fontSize:13,margin:"4px 0 0"}}>Click vào dự án để xem caption, chỉnh thông tin và tạo lại</p>
              </div>
              <button style={{...s.btnPrimary,fontSize:13}} onClick={()=>setStep(2)}>✏️ Chỉnh sửa chi tiết →</button>
            </div>
            <div style={s.projGrid}>
              {projects.map(proj=>(
                <div key={proj.id} style={{...s.projCard,border:expandedProj===proj.id?"2px solid #1565c0":"1px solid #e0e0e0"}}>
                  <div style={s.projCardHead} onClick={()=>setExpandedProj(expandedProj===proj.id?null:proj.id)}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={s.projThumb}>{proj.images[0]&&<img src={proj.images[0].url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:"#1565c0"}}>{proj.name}</div>
                        <div style={{fontSize:12,color:"#888"}}>{proj.images.filter(i=>i.selected).length} ảnh • {proj.day} {proj.time}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {proj.approved&&<span style={s.tagGreen}>✅ Duyệt</span>}
                      <span style={{color:"#999",fontSize:12}}>{expandedProj===proj.id?"▲":"▼"}</span>
                    </div>
                  </div>
                  {expandedProj===proj.id&&(
                    <div style={{borderTop:"1px solid #f0f0f0",padding:"12px 16px"}}>
                      <div style={s.captionTabs}>
                        {Object.entries(CAPTION_LABELS).map(([k,l])=>(
                          <button key={k} style={{...s.captionTab,...(proj.activeCaption===k?s.captionTabActive:{})}}
                            onClick={()=>updateProj(proj.id,{activeCaption:k,customCaption:proj.captions[k]||""})}>
                            {l}
                          </button>
                        ))}
                      </div>
                      <div style={s.captionPreview}>{proj.customCaption||proj.captions?.[proj.activeCaption]||""}</div>
                      <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                        <button style={s.btnSm} onClick={()=>regenCaptions(proj)} disabled={loading}>🔄 Tạo lại</button>
                        <button style={{...s.btnSm,background:"#2e7d32"}} onClick={()=>{setExpandedProj(proj.id);setStep(2);}}>✏️ Chỉnh chi tiết</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BƯỚC 2: CHỈNH SỬA ── */}
        {step===2&&(
          <div>
            <div style={s.stepHeader}>
              <div>
                <h2 style={s.h2}>✏️ Chỉnh sửa chi tiết</h2>
                <p style={{color:"#888",fontSize:13,margin:"4px 0 0"}}>Cập nhật thông tin, chọn ảnh và tinh chỉnh caption</p>
              </div>
              <button style={{...s.btnPrimary,fontSize:13}} onClick={()=>setStep(3)}>📅 Đặt lịch đăng →</button>
            </div>

            {projects.map(proj=>(
              <div key={proj.id} style={{...s.card,opacity:proj.approved?0.7:1}}>
                <div style={s.cardHead} onClick={()=>setExpandedProj(expandedProj===proj.id?null:proj.id)}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={s.projThumb}>{proj.images[0]&&<img src={proj.images[0].url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>
                    <div>
                      <span style={s.projTitle}>{proj.name}</span>
                      <div style={{fontSize:12,color:"#888",marginTop:2}}>{proj.images.filter(i=>i.selected).length} ảnh • {proj.day} {proj.time}</div>
                    </div>
                    {proj.approved&&<span style={s.tagGreen}>✅ Đã duyệt</span>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div onClick={e=>e.stopPropagation()}>
                      <label style={{...s.fieldLabel,display:"inline",marginRight:6}}>Giọng văn:</label>
                      <select style={s.sel} value={proj.tone} onChange={e=>handleToneChange(proj.id,e.target.value)}>
                        {Object.entries(BRAND_TONES).map(([k,v])=><option key={k} value={k}>{v.split("–")[0].trim()}</option>)}
                      </select>
                    </div>
                    <span style={{color:"#999",fontSize:14}}>{expandedProj===proj.id?"▲ Thu gọn":"▼ Mở rộng"}</span>
                  </div>
                </div>

                {expandedProj===proj.id&&(
                  <div style={{borderTop:"1px solid #f0f0f0",paddingTop:16}}>
                    <div style={s.section}>
                      <div style={s.sectionTitleRow}>
                        <div style={s.sectionTitle}>📋 Thông tin dự án</div>
                        <button style={{...s.btnSm,background:"#e65100"}} onClick={()=>regenCaptions(proj)} disabled={loading}>
                          {loading?"⏳...":"🔄 Cập nhật Caption"}
                        </button>
                      </div>
                      <div style={s.infoGrid}>
                        {INFO_FIELDS.map(f=>(
                          <div key={f.key} style={f.multiline?{gridColumn:"1/-1"}:{}}>
                            <label style={s.fieldLabel}>{f.label}</label>
                            {f.multiline?(
                              <textarea style={{...s.infoInp,minHeight:72,resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}
                                value={proj.info?.[f.key]||""} placeholder={f.placeholder}
                                onChange={e=>updateProj(proj.id,{info:{...proj.info,[f.key]:e.target.value}})}/>
                            ):(
                              <input style={s.infoInp} value={proj.info?.[f.key]||""} placeholder={f.placeholder}
                                onChange={e=>updateProj(proj.id,{info:{...proj.info,[f.key]:e.target.value}})}/>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={s.section}>
                      <div style={s.sectionTitle}>📡 Số lượng bài đăng / tuần</div>
                      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:8}}>
                        <div style={s.channelBox}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                            <span style={{fontSize:20}}>📘</span>
                            <span style={{fontWeight:700,fontSize:14}}>Facebook</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <button style={s.countBtn} onClick={()=>updateProj(proj.id,{channels:{...proj.channels,facebook:Math.max(0,(proj.channels?.facebook||1)-1)}})}>−</button>
                            <span style={{fontWeight:800,fontSize:20,minWidth:28,textAlign:"center"}}>{proj.channels?.facebook??1}</span>
                            <button style={s.countBtn} onClick={()=>updateProj(proj.id,{channels:{...proj.channels,facebook:(proj.channels?.facebook||1)+1}})}>+</button>
                            <span style={{fontSize:12,color:"#888"}}>bài/tuần</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={s.twoCol}>
                      <div style={{flex:"0 0 auto"}}>
                        <div style={s.sectionTitle}>🖼 Chọn ảnh ({proj.images.filter(i=>i.selected).length} đã chọn)</div>
                        <div style={s.imgGrid}>
                          {proj.images.map((img,idx)=>(
                            <div key={idx} style={{...s.imgThumb,outline:img.selected?"3px solid #1976d2":"3px solid transparent"}} onClick={()=>toggleImg(proj.id,idx)}>
                              <img src={img.url} alt="" style={s.imgInner}/>
                              {img.selected&&<div style={s.imgBadge}>✓</div>}
                            </div>
                          ))}
                        </div>
                        <p style={{fontSize:11,color:"#999",marginTop:4}}>Click để chọn/bỏ chọn</p>
                      </div>

                      <div style={{flex:1,minWidth:0}}>
                        <div style={s.sectionTitle}>✍️ Caption</div>
                        <div style={s.captionTabs}>
                          {Object.entries(CAPTION_LABELS).map(([k,l])=>(
                            <button key={k} style={{...s.captionTab,...(proj.activeCaption===k?s.captionTabActive:{})}}
                              onClick={()=>updateProj(proj.id,{activeCaption:k,customCaption:proj.captions[k]||""})}>
                              {l}
                            </button>
                          ))}
                        </div>
                        <textarea style={s.textarea} value={proj.customCaption||""} rows={9}
                          onChange={e=>updateProj(proj.id,{customCaption:e.target.value})}/>

                        <div style={{marginTop:8}}>
                          <div style={s.fieldLabel}>Điều chỉnh caption:</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
                            {ADJUST_BTNS.map(btn=>(
                              <button key={btn.key} disabled={loading}
                                style={{...s.adjustBtn,background:proj.pendingAdjust===btn.key?"#1565c0":btn.color,outline:proj.pendingAdjust===btn.key?"3px solid #90caf9":"none"}}
                                onClick={()=>updateProj(proj.id,{pendingAdjust:proj.pendingAdjust===btn.key?null:btn.key})}>
                                {btn.label}
                              </button>
                            ))}
                          </div>
                          {proj.pendingAdjust&&(
                            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,padding:"8px 12px",background:"#e3f2fd",borderRadius:8}}>
                              <span style={{fontSize:13,color:"#1565c0"}}>Đã chọn: <b>{ADJUST_BTNS.find(b=>b.key===proj.pendingAdjust)?.label}</b></span>
                              <button style={{...s.btnSm,background:"#1565c0"}} disabled={loading}
                                onClick={async()=>{
                                  setLoading(true);
                                  const result=await adjustCaption(proj.customCaption,proj.pendingAdjust,groqKey);
                                  updateProj(proj.id,{customCaption:result,pendingAdjust:null});
                                  setLoading(false);
                                  showToast("✅ Đã cập nhật caption!");
                                }}>
                                {loading?"⏳...":"✅ Áp dụng"}
                              </button>
                              <button style={s.btnXs} onClick={()=>updateProj(proj.id,{pendingAdjust:null})}>✕</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SCHEDULE PICKER inside Edit — dùng TimePickerRow */}
                    <div style={{...s.section,marginTop:14}}>
                      <div style={s.sectionTitleRow}>
                        <div style={s.sectionTitle}>📅 Mốc thời gian đăng</div>
                        <button style={s.btnXs} onClick={()=>{const slot=randomSlot();updateProj(proj.id,slot);showToast("🎲 Random lịch mới!");}}>🎲 Random</button>
                      </div>
                      <div style={{fontSize:12,color:"#888",marginBottom:8}}>
                        Đang chọn: <b style={{color:"#1565c0"}}>{proj.day}</b> lúc <b style={{color:"#1565c0"}}>{proj.time}</b>
                        <span style={{marginLeft:8,color:"#aaa"}}>({getNextDate(proj.day).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"})})</span>
                      </div>
                      <div style={{marginBottom:8}}>
                        <div style={s.fieldLabel}>Chọn ngày</div>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                          {ALL_DAYS.map(d=>(
                            <button key={d} style={{...s.dayChip,...(proj.day===d?s.dayChipActive:{})}} onClick={()=>updateProj(proj.id,{day:d})}>{d}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={s.fieldLabel}>Chọn giờ</div>
                        <TimePickerRow proj={proj} />
                      </div>
                    </div>

                    <div style={{display:"flex",gap:10,marginTop:16}}>
                      <button style={{...s.btnApprove,flex:1,opacity:proj.approved?0.5:1}} onClick={()=>approvePost(proj)} disabled={proj.approved}>
                        {proj.approved?"✅ Đã duyệt":"✅ Duyệt & lên lịch →"}
                      </button>
                      {proj.approved&&(
                        <button style={{...s.btnSm,background:"#e65100"}} onClick={()=>setScheduleEdit({projId:proj.id,day:proj.day,time:proj.time})}>
                          ✏️ Đổi lịch
                        </button>
                      )}
                      {proj.approved&&(
                        <button style={{...s.btnXs}} onClick={()=>{updateProj(proj.id,{approved:false});setPosts(prev=>prev.filter(p=>p.projId!==proj.id));showToast("↩️ Đã mở lại");}}>
                          ↩️ Sửa nội dung
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── BƯỚC 3: LỊCH ĐĂNG ── */}
        {step===3&&(
          <div>
            <div style={s.stepHeader}>
              <div>
                <h2 style={s.h2}>📅 Lịch đăng</h2>
                <p style={{color:"#888",fontSize:13,margin:"4px 0 0"}}>Chỉnh ngày giờ cho từng dự án, sau đó duyệt hàng loạt</p>
              </div>
              <div style={{display:"flex",gap:8}}>
                {/* ✅ SỬA: hiển thị số pending đúng */}
                <button style={{...s.btnSm,background:"#2e7d32",fontSize:13,padding:"8px 18px"}} onClick={approveAll}>
                  ✅ Duyệt tất cả ({pendingCount})
                </button>
                <button style={{...s.btnPrimary,fontSize:13}} onClick={()=>setStep(4)}>🚀 Xem Ổ chờ →</button>
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {projects.map(proj=>(
                <div key={proj.id} style={{...s.card,padding:"14px 18px"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                    <div style={s.projThumb}>{proj.images[0]&&<img src={proj.images[0].url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>
                    <div style={{flex:1,minWidth:180}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#1565c0"}}>{proj.name}</div>
                      <div style={{fontSize:12,color:"#888",marginTop:2}}>{proj.images.filter(i=>i.selected).length} ảnh • {proj.info?.brand||""}</div>
                    </div>

                    <div style={{flex:2,minWidth:300}}>
                      <div style={{marginBottom:8}}>
                        <div style={s.fieldLabel}>Ngày đăng</div>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                          {ALL_DAYS.map(d=>(
                            <button key={d} style={{...s.dayChip,...(proj.day===d?s.dayChipActive:{})}} onClick={()=>updateProj(proj.id,{day:d})}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={s.fieldLabel}>Giờ đăng</div>
                        {/* ✅ Dùng TimePickerRow — fix lỗi nút cũ không bỏ highlight */}
                        <TimePickerRow proj={proj} />
                      </div>
                    </div>

                    <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                      <button style={s.btnXs} onClick={()=>{const slot=randomSlot();updateProj(proj.id,slot);}}>🎲 Random</button>
                      {proj.approved
                        ?<span style={{...s.tagGreen,fontSize:12}}>✅ Duyệt rồi</span>
                        :<button style={{...s.btnSm,background:"#2e7d32",fontSize:12}} onClick={()=>approvePost(proj)}>✅ Duyệt</button>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BƯỚC 4: ĐĂNG BÀI ── */}
        {step===4&&(
          <div>
            <div style={s.stepHeader}>
              <div>
                <h2 style={s.h2}>🚀 Ổ chờ — Xem trước & Đăng</h2>
                <p style={{color:"#888",fontSize:13,margin:"4px 0 0"}}>{posts.length} bài đã duyệt • {postedCount} đã đăng Facebook</p>
              </div>
            </div>

            {posts.length===0&&(
              <div style={s.emptyState}>
                <div style={{fontSize:48}}>🗂</div>
                <p>Chưa có bài nào được duyệt.</p>
                <button style={s.btnPrimary} onClick={()=>setStep(3)}>← Đặt lịch đăng</button>
              </div>
            )}

            <div style={s.previewGrid}>
              {posts.map(post=>(
                <div key={post.id} style={s.fbCard}>
                  <div style={s.fbHeader}>
                    <div style={s.fbAvatar}>{agencyName[0]||"B"}</div>
                    <div style={{flex:1}}>
                      <div style={s.fbPageName}>{agencyName}</div>
                      <div style={s.fbMeta}>
                        📅 {post.scheduledDate.toLocaleDateString("vi-VN",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"})} · {post.time}
                        {post.posted&&<span style={{...s.tagGreen,marginLeft:6}}>✅ Đã đăng</span>}
                      </div>
                      {fbPageUrl&&<a href={fbPageUrl.startsWith("http")?fbPageUrl:"https://"+fbPageUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#1877f2",fontWeight:600}}>📘 Xem Fanpage →</a>}
                    </div>
                    {!post.posted&&<button style={s.btnXs} onClick={()=>setStep(2)}>✏️ Sửa</button>}
                  </div>
                  <textarea style={s.fbCaption} value={post.customCaption} rows={5}
                    onChange={e=>updatePost(post.id,{customCaption:e.target.value})} disabled={post.posted}/>
                  <div style={{display:"grid",gridTemplateColumns:post.images.length===1?"1fr":"1fr 1fr",gap:2}}>
                    {post.images.slice(0,4).map((img,i)=>(
                      <div key={i} style={{position:"relative",overflow:"hidden",background:"#f0f0f0",height:160}}>
                        <img src={img.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        {i===3&&post.images.length>4&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800}}>+{post.images.length-4}</div>}
                      </div>
                    ))}
                  </div>
                  <div style={s.fbActions}><span>👍 Thích</span><span>💬 Bình luận</span><span>↗️ Chia sẻ</span></div>
                  <div style={{padding:"10px 12px",borderTop:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div style={{fontSize:12,color:"#555"}}><b>{post.day}</b> lúc <b>{post.time}</b> · {post.scheduledDate.toLocaleDateString("vi-VN")}</div>
                    {!post.posted
                      ?<div style={{display:"flex",gap:8}}>
                          <button style={{...s.btnFB,background:"#e65100"}} onClick={()=>publishNow(post)} disabled={loading}>{loading?"⏳...":"⚡ Đăng ngay"}</button>
                          <button style={s.btnFB} onClick={()=>publishPost(post)} disabled={loading}>{loading?"⏳...":"🚀 Lên lịch"}</button>
                        </div>
                      :<span style={{fontSize:12,color:"#2e7d32",fontWeight:700}}>✅ Post ID: {post.fbPostId}</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SCHEDULE EDIT MODAL ── */}
      {scheduleEdit&&(
        <div style={s.overlay} onClick={()=>setScheduleEdit(null)}>
          <div style={s.settingsPanel} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{margin:0,color:"#1565c0"}}>📅 Đổi lịch đăng</h3>
              <button style={s.btnXs} onClick={()=>setScheduleEdit(null)}>✕</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={s.fieldLabel}>Chọn ngày</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {ALL_DAYS.map(d=>(
                  <button key={d}
                    style={{...s.dayChip,...(scheduleEdit.day===d?s.dayChipActive:{})}}
                    onClick={()=>setScheduleEdit(prev=>({...prev,day:d}))}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={s.fieldLabel}>Chọn giờ</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                {GOLDEN_TIMES.map(t=>(
                  <button key={t}
                    style={{...s.dayChip,...(scheduleEdit.time===t?s.dayChipActive:{})}}
                    onClick={()=>setScheduleEdit(prev=>({...prev,time:t,customTime:""}))}>
                    {t}
                  </button>
                ))}
                <div style={{display:"flex",alignItems:"center",gap:4,
                  border: !GOLDEN_TIMES.includes(scheduleEdit.time) ? "2px solid #1565c0" : "1px solid #ddd",
                  borderRadius:8, padding:"2px 6px"
                }}>
                  <input type="time" style={{border:"none",outline:"none",fontSize:12,padding:"2px",width:90}}
                    value={scheduleEdit.customTime||""}
                    onChange={e=>setScheduleEdit(prev=>({...prev,customTime:e.target.value}))}/>
                  <button style={{...s.btnXs,background:"#e3f2fd",color:"#1565c0",fontSize:11,border:"none"}}
                    onClick={()=>{if(scheduleEdit.customTime) setScheduleEdit(prev=>({...prev,time:prev.customTime}))}}>
                    ⏰ Áp dụng
                  </button>
                </div>
                <button style={{...s.dayChip,background:"#e65100",color:"#fff",borderColor:"#e65100",fontWeight:700}}
                  onClick={()=>{
                    const now=new Date();
                    const hm=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
                    setScheduleEdit(prev=>({...prev,time:hm,customTime:"",day:ALL_DAYS[now.getDay()===0?6:now.getDay()-1]}));
                  }}>⚡ Ngay</button>
              </div>
              {!GOLDEN_TIMES.includes(scheduleEdit.time) && scheduleEdit.time && (
                <div style={{fontSize:11,color:"#1565c0",fontWeight:700,marginTop:6}}>✅ Giờ đã chọn: {scheduleEdit.time}</div>
              )}
            </div>
            <div style={{background:"#f0f4ff",borderRadius:8,padding:10,marginBottom:16,fontSize:13}}>
              Lịch mới: <b style={{color:"#1565c0"}}>{scheduleEdit.day}</b> lúc <b style={{color:"#1565c0"}}>{scheduleEdit.time}</b>
              <span style={{marginLeft:8,color:"#aaa",fontSize:11}}>({getNextDate(scheduleEdit.day).toLocaleDateString("vi-VN")})</span>
            </div>
            <button style={{...s.btnApprove,width:"100%"}} onClick={()=>{
              const {projId,day,time}=scheduleEdit;
              updateProj(projId,{day,time,approved:false});
              setPosts(prev=>prev.filter(p=>p.projId!==projId));
              const proj=projects.find(p=>p.id===projId);
              if(proj){
                const selected=proj.images.filter(i=>i.selected);
                if(selected.length){
                  const d=getNextDate(day);
                  const [h,m]=time.split(":").map(Number); d.setHours(h,m,0,0);
                  const post={...proj,day,time,id:Date.now()+Math.random(),projId,scheduledDate:d,images:selected,posted:false};
                  setPosts(prev=>[...prev.filter(p=>p.projId!==projId),post]);
                  updateProj(projId,{approved:true,day,time});
                }
              }
              setScheduleEdit(null);
              showToast("✅ Đã cập nhật lịch mới!");
            }}>
              ✅ Xác nhận lịch mới
            </button>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL ── */}
      {settingsOpen&&(
        <div style={s.overlay} onClick={()=>setSettingsOpen(false)}>
          <div style={s.settingsPanel} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{margin:0,fontSize:18,color:"#1565c0"}}>⚙️ Cài đặt</h2>
              <button style={s.btnXs} onClick={()=>setSettingsOpen(false)}>✕ Đóng</button>
            </div>
            <div style={s.settingGroup}>
              <h3 style={s.h3}>🏢 Tên Agency</h3>
              <input style={s.inp} value={agencyName} placeholder="VD: Blue Sky Corporation"
                onChange={e=>{setAgencyName(e.target.value);localStorage.setItem("agency_name",e.target.value);}}/>
            </div>
            <div style={{...s.settingGroup,marginTop:16}}>
              <h3 style={s.h3}>🤖 Groq API Key (AI Caption – Miễn phí)</h3>
              <div style={{background:"#f0f4ff",borderRadius:8,padding:12,marginBottom:10,fontSize:12}}>
                Vào <b>console.groq.com</b> → API Keys → Create → copy key dạng <code style={s.code}>gsk_...</code>
              </div>
              <input style={s.inp} type="password" value={groqKey} placeholder="gsk_..."
                onChange={e=>{setGroqKey(e.target.value);localStorage.setItem("groq_key",e.target.value);}}/>
              <button style={{...s.btnSm,marginTop:8}} onClick={async()=>{
                if(!groqKey){showToast("Chưa nhập key!","err");return;}
                try{
                  const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${groqKey}`},body:JSON.stringify({model:"llama-3.1-8b-instant",messages:[{role:"user",content:"Hi"}],max_tokens:10})});
                  const d=await res.json();
                  d.choices?showToast("✅ Groq OK!"):showToast("❌ Key sai","err");
                }catch(e){showToast("❌ Lỗi: "+e.message,"err");}
              }}>🔌 Kiểm tra kết nối</button>
            </div>
            <div style={{...s.settingGroup,marginTop:16}}>
              <h3 style={s.h3}>📘 Facebook Page</h3>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div><label style={s.fieldLabel}>URL Fanpage</label>
                  <input style={s.inp} value={fbPageUrl} placeholder="facebook.com/TenPage"
                    onChange={e=>{setFbPageUrl(e.target.value);localStorage.setItem("fb_page_url",e.target.value);}}/></div>
                <div><label style={s.fieldLabel}>Page ID</label>
                  <input style={s.inp} value={fbPageId} placeholder="123456789 hoặc me"
                    onChange={e=>{setFbPageId(e.target.value);localStorage.setItem("fb_page_id",e.target.value);}}/></div>
                <div><label style={s.fieldLabel}>Page Access Token</label>
                  <input style={s.inp} type="password" value={fbPageToken} placeholder="EAABxxx..."
                    onChange={e=>{setFbPageToken(e.target.value);localStorage.setItem("fb_page_token",e.target.value);}}/></div>
                <button style={s.btnSm} onClick={async()=>{
                  try{
                    const r=await fetch("https://graph.facebook.com/v19.0/me?access_token="+fbPageToken);
                    const d=await r.json();
                    d.name?showToast("✅ Kết nối OK: "+d.name):showToast("❌ Token sai","err");
                  }catch{showToast("❌ Lỗi kết nối","err");}
                }}>🔌 Kiểm tra Facebook</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast&&<div style={{...s.toast,background:toast.type==="err"?"#c62828":"#1b5e20"}}>{toast.msg}</div>}
      {loading&&<div style={s.overlay}><div style={s.spinner}>🤖 AI đang xử lý...</div></div>}
    </div>
  );
}

const s={
  root:{fontFamily:"'Segoe UI',Arial,sans-serif",minHeight:"100vh",background:"#f4f6fa",color:"#212121"},
  nav:{background:"#1565c0",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexWrap:"wrap",gap:8},
  navLeft:{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"},
  brand:{fontWeight:800,fontSize:16,padding:"14px 0",whiteSpace:"nowrap"},
  navStats:{display:"flex",gap:6,flexWrap:"wrap"},
  statChip:{background:"rgba(255,255,255,0.15)",color:"#fff",borderRadius:10,padding:"3px 10px",fontSize:11,fontWeight:600},
  settingsBtn:{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",padding:"8px 14px",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600},
  progressBar:{background:"#fff",borderBottom:"1px solid #e0e0e0",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"center"},
  progressItem:{display:"flex",alignItems:"center",gap:6,position:"relative"},
  progressDot:{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,transition:"all .3s",flexShrink:0},
  progressLabel:{fontSize:12,whiteSpace:"nowrap",marginRight:4},
  progressLine:{width:32,height:2,margin:"0 4px",borderRadius:2,flexShrink:0},
  page:{maxWidth:1000,margin:"0 auto",padding:24},
  center:{display:"flex",justifyContent:"center"},
  heroBox:{background:"#fff",borderRadius:16,padding:40,maxWidth:680,width:"100%",boxShadow:"0 4px 20px rgba(0,0,0,.08)",textAlign:"center"},
  heroTitle:{fontSize:24,fontWeight:800,color:"#1565c0",margin:"0 0 8px"},
  heroSub:{color:"#666",marginBottom:24,lineHeight:1.6},
  toggle:{display:"inline-flex",background:"#f0f4ff",borderRadius:10,padding:4,marginBottom:24,gap:4},
  toggleBtn:{padding:"8px 20px",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13,background:"transparent",color:"#555"},
  toggleActive:{background:"#1565c0",color:"#fff"},
  dropZone:{border:"2px dashed #90caf9",borderRadius:12,padding:32,cursor:"pointer",marginBottom:12},
  btnPrimary:{background:"#1565c0",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontWeight:700,fontSize:14},
  flowRow:{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginTop:24},
  flowChip:{background:"#e3f2fd",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600,color:"#1565c0"},
  stepHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:12,flexWrap:"wrap"},
  h2:{fontSize:20,fontWeight:800,color:"#1565c0",margin:0},
  h3:{fontSize:14,fontWeight:700,margin:"0 0 10px"},
  projGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12},
  projCard:{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.06)"},
  projCardHead:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",cursor:"pointer"},
  projThumb:{width:48,height:48,borderRadius:8,overflow:"hidden",background:"#e3f2fd",flexShrink:0},
  card:{background:"#fff",borderRadius:12,padding:20,marginBottom:16,boxShadow:"0 2px 10px rgba(0,0,0,.07)"},
  cardHead:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,cursor:"pointer"},
  projTitle:{fontWeight:800,fontSize:16,color:"#1565c0"},
  tagGreen:{background:"#e8f5e9",color:"#2e7d32",borderRadius:10,padding:"2px 10px",fontSize:11,fontWeight:700},
  section:{background:"#f8f9ff",borderRadius:10,padding:14,marginBottom:14,border:"1px solid #e3eaf7"},
  sectionTitle:{fontSize:11,fontWeight:700,color:"#1565c0",textTransform:"uppercase",letterSpacing:.5,marginBottom:6},
  sectionTitleRow:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8},
  fieldLabel:{fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:4},
  infoGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8},
  infoInp:{width:"100%",border:"1px solid #ddd",borderRadius:6,padding:"6px 8px",fontSize:12,boxSizing:"border-box"},
  channelBox:{background:"#fff",border:"1px solid #e3eaf7",borderRadius:10,padding:"12px 18px",minWidth:160},
  countBtn:{width:30,height:30,border:"1px solid #ddd",borderRadius:6,cursor:"pointer",fontSize:18,fontWeight:700,background:"#f5f5f5",display:"flex",alignItems:"center",justifyContent:"center"},
  twoCol:{display:"flex",gap:20,flexWrap:"wrap"},
  imgGrid:{display:"flex",flexWrap:"wrap",gap:6,maxWidth:360},
  imgThumb:{position:"relative",borderRadius:8,overflow:"hidden",cursor:"pointer",width:72,height:72},
  imgInner:{width:"100%",height:"100%",objectFit:"cover",display:"block"},
  imgBadge:{position:"absolute",top:3,right:3,background:"#1976d2",color:"#fff",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800},
  captionTabs:{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap"},
  captionTab:{padding:"4px 10px",border:"1px solid #e0e0e0",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600,background:"#f5f5f5",color:"#555"},
  captionTabActive:{background:"#1565c0",color:"#fff",borderColor:"#1565c0"},
  captionPreview:{fontSize:13,lineHeight:1.6,color:"#444",background:"#f8f9ff",borderRadius:8,padding:10,maxHeight:120,overflow:"auto",whiteSpace:"pre-wrap"},
  textarea:{width:"100%",border:"1px solid #e0e0e0",borderRadius:8,padding:10,fontSize:13,lineHeight:1.7,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"},
  adjustBtn:{color:"#fff",border:"none",borderRadius:16,padding:"5px 12px",cursor:"pointer",fontWeight:600,fontSize:12},
  dayChip:{padding:"4px 10px",border:"1px solid #ddd",borderRadius:16,cursor:"pointer",fontSize:12,fontWeight:600,background:"#f5f5f5",color:"#555"},
  dayChipActive:{background:"#1565c0",color:"#fff",borderColor:"#1565c0"},
  btnApprove:{background:"#2e7d32",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontWeight:700,fontSize:14},
  btnSm:{background:"#1565c0",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",cursor:"pointer",fontWeight:600,fontSize:12},
  btnXs:{background:"#f5f5f5",color:"#333",border:"1px solid #ddd",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600},
  emptyState:{textAlign:"center",padding:60,color:"#999",background:"#fff",borderRadius:12},
  previewGrid:{display:"flex",flexDirection:"column",gap:20,maxWidth:560,margin:"0 auto"},
  fbCard:{background:"#fff",borderRadius:12,boxShadow:"0 2px 12px rgba(0,0,0,.1)",overflow:"hidden"},
  fbHeader:{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px"},
  fbAvatar:{width:40,height:40,background:"#1565c0",borderRadius:"50%",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,flexShrink:0},
  fbPageName:{fontWeight:700,fontSize:14},
  fbMeta:{fontSize:11,color:"#999",display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"},
  fbCaption:{width:"100%",border:"none",borderTop:"1px solid #f5f5f5",borderBottom:"1px solid #f5f5f5",padding:"10px 14px",fontSize:14,lineHeight:1.6,resize:"none",fontFamily:"inherit",boxSizing:"border-box",outline:"none",background:"#fafafa"},
  fbActions:{display:"flex",gap:16,borderTop:"1px solid #f0f0f0",borderBottom:"1px solid #f0f0f0",padding:"8px 14px"},
  btnFB:{background:"#1877f2",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13},
  settingsPanel:{background:"#fff",borderRadius:14,padding:28,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.2)"},
  settingGroup:{borderBottom:"1px solid #f0f0f0",paddingBottom:16},
  sel:{border:"1px solid #ddd",borderRadius:6,padding:"6px 8px",fontSize:13,cursor:"pointer"},
  inp:{width:"100%",border:"1px solid #ddd",borderRadius:6,padding:"8px 10px",fontSize:13,boxSizing:"border-box"},
  code:{background:"#e8eaf6",padding:"1px 5px",borderRadius:4,fontSize:11,fontFamily:"monospace"},
  toast:{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",color:"#fff",padding:"12px 24px",borderRadius:10,fontWeight:700,fontSize:14,zIndex:1000,maxWidth:"80vw",textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,.25)"},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999},
  spinner:{background:"#fff",borderRadius:12,padding:"20px 32px",fontSize:16,fontWeight:700},
};
