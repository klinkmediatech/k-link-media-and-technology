/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { 
  Monitor, 
  Wrench, 
  Globe, 
  FileText, 
  ShoppingBag, 
  Phone, 
  MessageCircle, 
  Volume2, 
  VolumeX, 
  Loader2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Send,
  X,
  User,
  Bot,
  Calculator,
  LayoutDashboard,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  CreditCard,
  Quote,
  Mail,
  MapPin,
  Award,
  Users,
  Briefcase,
  Star,
  ExternalLink,
  ArrowRight,
  Info,
  Clock,
  Megaphone,
  Shield,
  UserCheck,
  BookOpen,
  Settings,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI, Modality } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { auth, db, storage } from "./firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDoc,
  setDoc,
  Timestamp,
  getDocFromServer,
  orderBy
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Error Boundary Component
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SERVICES = [
  {
    title: "Software Installation",
    description: "Professional installation of operating systems, office suites, and specialized business software.",
    icon: Monitor,
    color: "text-blue-500",
    bg: "bg-blue-50",
    minPrice: "30,000 UGX",
    available: true
  },
  {
    title: "Hardware Repair",
    description: "Expert diagnosis and repair for laptops, desktops, and peripherals. Component-level fixes.",
    icon: Wrench,
    color: "text-orange-500",
    bg: "bg-orange-50",
    minPrice: "50,000 UGX",
    available: true
  },
  {
    title: "Web Design & Apps",
    description: "Custom website design and online application development tailored to your business needs.",
    icon: Globe,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    minPrice: "500,000 UGX",
    available: true
  },
  {
    title: "Online Registrations",
    description: "Assistance with all kinds of online registrations, applications, and digital submissions.",
    icon: FileText,
    color: "text-purple-500",
    bg: "bg-purple-50",
    minPrice: "25,000 UGX",
    available: true
  },
  {
    title: "Quality Computers",
    description: "Wide range of high-quality laptops and desktops at the most affordable prices in the market.",
    icon: ShoppingBag,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    minPrice: "800,000 UGX",
    available: true
  },
  {
    title: "Basic Computer Applications Training",
    description: "Comprehensive 6-month training in essential computer applications for all levels.",
    icon: GraduationCap,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    minPrice: "450,000 UGX",
    available: true,
    isTraining: true
  }
];

const PAYMENT_METHODS = `
**Payment Methods:**
- **MTN Mobile Money:** 0771942537 (K-Link Media)
- **Airtel Money:** 0701657733 (K-Link Media)

**Instructions:**
After making payment, please send the **payment reference** or a screenshot to our WhatsApp at **0771942537** for confirmation.
`;

const PROMO_TEXT = "Welcome to K-Link Media and Technology. We are your premier partner in ICT solutions, dedicated to bridging the digital divide in Uganda. Our mission is to provide affordable, high-quality technology services and training to empower our community. From expert hardware repairs to professional software development and comprehensive computer training, we are here to support your digital journey. How can we help you today?";

const DIRECTOR_MESSAGE = {
  name: "Okello K.",
  title: "Director, K-Link Media & Technology",
  message: "At K-Link, we believe that technology should be accessible to everyone. Our goal is to provide not just services, but solutions that transform lives and businesses. We are committed to excellence, integrity, and community empowerment through digital literacy.",
  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
};

const PORTFOLIO = [
  {
    title: "E-Commerce Platform",
    category: "Web Development",
    image: "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&q=80&w=800",
    description: "A full-featured online store for a local retail business."
  },
  {
    title: "School Management System",
    category: "Software Solution",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800",
    description: "Digitalizing student records and fee management for primary schools."
  },
  {
    title: "Corporate Branding",
    category: "Graphic Design",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800",
    description: "Complete visual identity refresh for a growing startup."
  }
];

const TESTIMONIALS = [
  {
    name: "Sarah Namukasa",
    role: "Business Owner",
    content: "K-Link transformed my business with a professional website. Their team is highly skilled and very responsive.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
  },
  {
    name: "James Okello",
    role: "Student",
    content: "The computer training at K-Link is top-notch. I gained practical skills that helped me land my first job.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
  },
  {
    name: "Mary Atim",
    role: "School Headteacher",
    content: "Their school management system has made our administrative work so much easier. Highly recommended!",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100"
  }
];

const STATS = [
  { label: "Happy Clients", value: "500+", icon: Users },
  { label: "Projects Done", value: "1,200+", icon: Briefcase },
  { label: "Students Trained", value: "300+", icon: GraduationCap },
  { label: "Awards Won", value: "12+", icon: Award }
];

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
      <Clock className="h-3.5 w-3.5 text-cyan-600" />
      <span>{time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      <span className="text-slate-300">|</span>
      <span className="text-slate-900">{time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  );
};

const UGANDA_DISTRICTS = [
  "Kampala", "Wakiso", "Mukono", "Jinja", "Mbarara", "Gulu", "Lira", "Masaka", "Entebbe", "Arua", "Mbale", "Fort Portal", "Soroti", "Kabale", "Hoima", "Tororo", "Busia", "Iganga", "Mityana", "Mubende", "Luwero", "Kayunga", "Buikwe", "Kalangala", "Rakai", "Lyantonde", "Kyotera", "Masindi", "Kiryandongo", "Buliisa", "Nakasongola", "Nakaseke", "Kiboga", "Kyankwanzi", "Kassanda", "Gomba", "Butambala", "Mpigi", "Ssembabule", "Bukomansimbi", "Lwengo", "Kalungu"
].sort();

const STUDY_PACKAGES = [
  { id: 'intro', name: 'Introduction to Computers', price: 5000, content: "### Introduction to Computers\n\nComputers are electronic devices that process data. They consist of hardware (physical parts) and software (instructions).\n\n**Key Concepts:**\n- **Input:** Keyboard, Mouse, Scanner\n- **Processing:** Central Processing Unit (CPU)\n- **Output:** Monitor, Printer, Speakers\n- **Storage:** Hard Drive, SSD, Flash Disks\n\n**Types of Computers:**\n1. Supercomputers\n2. Mainframes\n3. Minicomputers\n4. Microcomputers (PCs, Laptops, Tablets)" },
  { id: 'word', name: 'Microsoft Word (Word Processing)', price: 10000, content: "### Microsoft Word\n\nMicrosoft Word is a word processing application used to create documents like letters, resumes, and reports.\n\n**Key Features:**\n- **Home Tab:** Formatting text (bold, italic, underline, font size, color).\n- **Insert Tab:** Adding images, tables, shapes, and page numbers.\n- **Layout Tab:** Adjusting margins, orientation, and columns.\n- **Review Tab:** Spell check and grammar tools.\n\n**Shortcuts:**\n- Ctrl + S: Save\n- Ctrl + C: Copy\n- Ctrl + V: Paste\n- Ctrl + P: Print" },
  { id: 'excel', name: 'Microsoft Excel (Spreadsheets)', price: 10000, content: "### Microsoft Excel\n\nExcel is a spreadsheet program used for data analysis, calculations, and graphing.\n\n**Key Features:**\n- **Cells:** The intersection of a row and a column.\n- **Formulas:** Start with an equal sign (=). Example: `=SUM(A1:A10)`\n- **Functions:** Predefined formulas like AVERAGE, MIN, MAX, and IF.\n- **Charts:** Visual representation of data (Pie, Bar, Line charts).\n\n**Data Management:**\n- Sorting data alphabetically or numerically.\n- Filtering to show specific records." },
  { id: 'ppt', name: 'Microsoft PowerPoint (Presentations)', price: 10000, content: "### Microsoft PowerPoint\n\nPowerPoint is used to create visual presentations using slides.\n\n**Key Features:**\n- **Slides:** Individual pages of a presentation.\n- **Transitions:** Visual effects when moving from one slide to another.\n- **Animations:** Effects applied to objects on a slide (text, images).\n- **Themes:** Pre-designed layouts and color schemes.\n\n**Presentation Tips:**\n- Keep text minimal (Rule of 6x6).\n- Use high-quality images.\n- Maintain consistent design." },
  { id: 'internet', name: 'Internet & Email', price: 5000, content: "### Internet & Email\n\nUnderstanding how to navigate the web safely and communicate via email.\n\n**Key Concepts:**\n- **Web Browsers:** Software used to access the internet (Google Chrome, Microsoft Edge, Mozilla Firefox).\n- **Search Engines:** Websites used to find information (Google, Bing).\n- **URL:** Uniform Resource Locator (Web address).\n- **Email:** Electronic mail for digital communication.\n\n**Online Safety:**\n- Use strong passwords.\n- Avoid clicking suspicious links (phishing).\n- Log out from public computers." }
];

export default function App() {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showLearnerPortal, setShowLearnerPortal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Chat Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    {
      role: 'assistant',
      content: "Hello! Welcome to K-Link Media and Technology. I'm your ICT assistant. How can I help you today?\n\nAre you looking for:\n- **Hardware repairs** for your laptop or desktop?\n- **Software installation** or OS upgrades?\n- **Web design** for your business?\n- **Online training** in computer applications?\n\nLet me know what you need, or ask me any question!"
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatStartedAt, setChatStartedAt] = useState<number | null>(null);
  const [hasShownContactPrompt, setHasShownContactPrompt] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Enrollment Form State
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState({
    studentName: "",
    dob: "",
    age: 0,
    phone: "",
    village: "",
    parish: "",
    subCounty: "",
    district: "",
    nin: "",
    parentName: "",
    parentPhone: "",
    course: "Basic Computer Applications Training"
  });
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  // Learner Portal State
  const [portalStep, setPortalStep] = useState<'login' | 'set-pin' | 'enter-pin' | 'dashboard'>('login');
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Admin State
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [learnerEnrollments, setLearnerEnrollments] = useState<any[]>([]);
  const [learnerNotifications, setLearnerNotifications] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [studyAccess, setStudyAccess] = useState<any[]>([]);
  const [directorProfile, setDirectorProfile] = useState<any>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<'enrollments' | 'payments' | 'director' | 'banner' | 'users' | 'logo' | 'hero' | 'adverts'>('enrollments');
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);

  // Logo State
  const [logoUrl, setLogoUrl] = useState("input_file_0.png");
  const [heroImageUrl, setHeroImageUrl] = useState("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000");
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const [isUpdatingHero, setIsUpdatingHero] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);

  // Adverts State
  const [adverts, setAdverts] = useState<any[]>([]);
  const [isUpdatingAdvert, setIsUpdatingAdvert] = useState(false);
  const [advertForm, setAdvertForm] = useState({ title: "", description: "", imageUrl: "", link: "", active: true, order: 0 });
  const [advertImageFile, setAdvertImageFile] = useState<File | null>(null);
  const [editingAdvertId, setEditingAdvertId] = useState<string | null>(null);

  // Users Management State
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isUpdatingDirector, setIsUpdatingDirector] = useState(false);
  const [directorForm, setDirectorForm] = useState({ name: "", title: "", message: "", imageUrl: "" });
  const [directorImageFile, setDirectorImageFile] = useState<File | null>(null);

  // Advert Banner State
  const [advertBanner, setAdvertBanner] = useState({ text: "Special Offer: 20% Discount on all Computer Training Courses this month!", active: true });
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    contact: "",
    subject: "",
    message: ""
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Enrollment Form Errors
  const [enrollmentErrors, setEnrollmentErrors] = useState<Record<string, string>>({});

  // Real-time Validation for Contact Form
  useEffect(() => {
    const errors: Record<string, string> = {};
    if (contactForm.name && contactForm.name.length < 3) errors.name = "Name must be at least 3 characters";
    if (contactForm.contact) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.contact);
      const isPhone = /^\+?[\d\s-]{10,}$/.test(contactForm.contact);
      if (!isEmail && !isPhone) errors.contact = "Enter a valid email or phone number";
    }
    if (contactForm.message && contactForm.message.length < 10) errors.message = "Message must be at least 10 characters";
    setContactErrors(errors);
  }, [contactForm]);

  // Real-time Validation for Enrollment Form
  useEffect(() => {
    const errors: Record<string, string> = {};
    if (enrollmentData.studentName && enrollmentData.studentName.length < 3) errors.studentName = "Full name is too short";
    if (enrollmentData.phone && !/^\+?[\d\s-]{10,}$/.test(enrollmentData.phone)) errors.phone = "Invalid phone number";
    if (enrollmentData.parentPhone && !/^\+?[\d\s-]{10,}$/.test(enrollmentData.parentPhone)) errors.parentPhone = "Invalid guardian phone";
    if (enrollmentData.nin && enrollmentData.nin.length < 14) errors.nin = "NIN should be 14 characters";
    setEnrollmentErrors(errors);
  }, [enrollmentData]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            setIsAdmin(['admin', 'manager', 'instructor'].includes(data.role));
            setPortalStep(data.pinSet ? 'enter-pin' : 'set-pin');
          } else if (currentUser.email === "okellok2000@gmail.com") {
            const adminData = {
              email: currentUser.email,
              role: 'admin',
              displayName: currentUser.displayName,
              pinSet: false
            };
            await setDoc(doc(db, 'users', currentUser.uid), adminData);
            setUserProfile(adminData);
            setIsAdmin(true);
            setPortalStep('set-pin');
          } else {
            // New learner
            const learnerData = {
              email: currentUser.email,
              role: 'learner',
              displayName: currentUser.displayName,
              pinSet: false
            };
            await setDoc(doc(db, 'users', currentUser.uid), learnerData);
            setUserProfile(learnerData);
            setIsAdmin(false);
            setPortalStep('set-pin');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser?.uid}`);
        }
      } else {
        setIsAdmin(false);
        setShowAdminPortal(false);
        setShowLearnerPortal(false);
        setUserProfile(null);
        setPortalStep('login');
      }
    });
    return () => unsubscribe();
  }, []);

  // Logo Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'siteConfig', 'logo'), (doc) => {
      if (doc.exists()) {
        setLogoUrl(doc.data().url);
      }
    });
    return () => unsubscribe();
  }, []);

  // Hero Image Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'siteConfig', 'hero'), (doc) => {
      if (doc.exists()) {
        setHeroImageUrl(doc.data().url);
      }
    });
    return () => unsubscribe();
  }, []);

  // Adverts Listener
  useEffect(() => {
    const q = query(collection(db, 'adverts'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdverts(ads);
    });
    return () => unsubscribe();
  }, []);

  // Automated Age Calculation
  useEffect(() => {
    if (enrollmentData.dob) {
      const birthDate = new Date(enrollmentData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setEnrollmentData(prev => ({ ...prev, age: age > 0 ? age : 0 }));
    }
  }, [enrollmentData.dob]);

  useEffect(() => {
    if (isAdmin && showAdminPortal) {
      const path = 'enrollments';
      const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEnrollments(data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds || 0) * 1000;
          const timeB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds || 0) * 1000;
          return timeB - timeA;
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });

      const paymentsUnsubscribe = onSnapshot(collection(db, 'payment_requests'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPaymentRequests(data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds || 0) * 1000;
          const timeB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds || 0) * 1000;
          return timeB - timeA;
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'payment_requests');
      });

      const directorUnsubscribe = onSnapshot(doc(db, 'siteConfig', 'director'), (doc) => {
        if (doc.exists()) {
          const data = doc.data() as { name: string; title: string; message: string; imageUrl: string; };
          setDirectorProfile(data);
          setDirectorForm(data);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'siteConfig/director');
      });

      const bannerUnsubscribe = onSnapshot(doc(db, 'siteConfig', 'banner'), (doc) => {
        if (doc.exists()) {
          setAdvertBanner(doc.data() as { text: string; active: boolean });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'siteConfig/banner');
      });

      const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });

      return () => {
        unsubscribe();
        paymentsUnsubscribe();
        directorUnsubscribe();
        bannerUnsubscribe();
        usersUnsubscribe();
      };
    } else {
      // Public banner listener
      return onSnapshot(doc(db, 'siteConfig', 'banner'), (doc) => {
        if (doc.exists()) {
          setAdvertBanner(doc.data() as { text: string; active: boolean });
        }
      });
    }
  }, [isAdmin, showAdminPortal]);

  useEffect(() => {
    if (user && !isAdmin && showLearnerPortal) {
      const path = 'enrollments';
      const q = query(collection(db, path), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLearnerEnrollments(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });

      const accessUnsubscribe = onSnapshot(query(collection(db, 'study_access'), where('userId', '==', user.uid)), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudyAccess(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'study_access');
      });

      return () => {
        unsubscribe();
        accessUnsubscribe();
      };
    }
  }, [user, isAdmin, showLearnerPortal]);

  useEffect(() => {
    if (user && !isAdmin && showLearnerPortal) {
      const path = 'notifications';
      const q = query(collection(db, path), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by createdAt desc client-side to avoid index requirement for now
        setLearnerNotifications(data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });
      return () => unsubscribe();
    }
  }, [user, isAdmin, showLearnerPortal]);

  const handleConfirmEnrollment = async (enrollment: any) => {
    try {
      await updateDoc(doc(db, 'enrollments', enrollment.id), {
        status: 'confirmed',
        confirmedAt: serverTimestamp()
      });
      
      // Create notification for the user
      if (enrollment.userId && enrollment.userId !== 'anonymous') {
        await addDoc(collection(db, 'notifications'), {
          userId: enrollment.userId,
          title: "Enrollment Confirmed",
          message: `Your enrollment for ${enrollment.course} has been confirmed. Welcome to K-Link!`,
          type: 'enrollment_confirmed',
          createdAt: serverTimestamp(),
          read: false
        });
      }

      setNotification("Enrollment confirmed! Confirmation messages sent to portal, email, and phone.");
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `enrollments/${enrollment.id}`);
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'enrollments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `enrollments/${id}`);
    }
  };

  const handlePayNow = async (pkg: any) => {
    if (!user) return;
    setIsProcessingPayment(true);
    try {
      await addDoc(collection(db, 'payment_requests'), {
        userId: user.uid,
        studentName: userProfile?.displayName || user.email,
        packageId: pkg.id,
        packageName: pkg.name,
        amount: pkg.price,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setNotification(`Payment request for ${pkg.name} sent to admin. Please complete payment using the instructions.`);
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payment_requests');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmPayment = async (request: any) => {
    try {
      await updateDoc(doc(db, 'payment_requests', request.id), {
        status: 'confirmed',
        confirmedAt: serverTimestamp()
      });

      // Grant access
      await addDoc(collection(db, 'study_access'), {
        userId: request.userId,
        packageId: request.packageId,
        grantedAt: serverTimestamp()
      });

      // Notify user
      await addDoc(collection(db, 'notifications'), {
        userId: request.userId,
        title: "Payment Confirmed",
        message: `Your payment for ${request.packageName} has been confirmed. You can now access the study materials!`,
        type: 'payment_confirmed',
        createdAt: serverTimestamp(),
        read: false
      });

      setNotification("Payment confirmed and access granted!");
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payment_requests/${request.id}`);
    }
  };

  const handleSetPin = async () => {
    if (pinInput.length !== 4 || !/^\d+$/.test(pinInput)) {
      setPinError("PIN must be 4 digits");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        pin: pinInput,
        pinSet: true
      });
      setUserProfile((prev: any) => ({ ...prev, pin: pinInput, pinSet: true }));
      setPortalStep('dashboard');
      setPinInput("");
      setPinError("");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user?.uid}`);
    }
  };

  const handleVerifyPin = () => {
    if (pinInput === userProfile.pin) {
      setPortalStep('dashboard');
      setPinInput("");
      setPinError("");
    } else {
      setPinError("Incorrect PIN");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(enrollmentErrors).length > 0) {
      setNotification("Please fix the errors in the enrollment form.");
      return;
    }
    setIsSubmittingEnrollment(true);
    try {
      await addDoc(collection(db, 'enrollments'), {
        ...enrollmentData,
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: user?.uid || 'anonymous'
      });
      setEnrollmentSuccess(true);
      setEnrollmentData({
        studentName: "",
        dob: "",
        age: 0,
        phone: "",
        village: "",
        parish: "",
        subCounty: "",
        district: "",
        nin: "",
        parentName: "",
        parentPhone: "",
        course: "Basic Computer Applications Training"
      });
      
      // Add success message to chat
      const successMsg = `Application successful! Thank you for enrolling in ${enrollmentData.course}. 
      
Please process your payment of **450,000 UGX** via Mobile Money or in cash at our office.
${PAYMENT_METHODS}`;
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: successMsg }]);
      setIsChatOpen(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'enrollments');
    } finally {
      setIsSubmittingEnrollment(false);
    }
  };

  const [loginError, setLoginError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoginError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/user-cancelled' || error.code === 'auth/popup-closed-by-user') {
        setLoginError("The login window was closed before completion. Please try again and keep the window open.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        setLoginError("A login request is already in progress. Please wait.");
      } else if (error.code === 'auth/popup-blocked') {
        setLoginError("Login popup was blocked by your browser. Please allow popups for this site in your browser settings.");
      } else if (error.code === 'auth/network-request-failed') {
        setLoginError("Network error. Please check your internet connection and try again.");
      } else {
        setLoginError(`Login failed: ${error.message || "An unknown error occurred"}`);
      }
      
      // Clear error after 8 seconds for better visibility
      setTimeout(() => setLoginError(null), 8000);
    } finally {
      // Small delay to prevent rapid re-clicks
      setTimeout(() => setIsLoggingIn(false), 1000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  useEffect(() => {
    if (chatStartedAt && !hasShownContactPrompt) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now - chatStartedAt >= 60000) { // 1 minute
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: "I'm here to help! For more detailed inquiries or urgent support, feel free to call us on **0701657733** or reach us on WhatsApp at **0771942537**. We're always happy to assist!"
          }]);
          setHasShownContactPrompt(true);
          clearInterval(interval);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [chatStartedAt, hasShownContactPrompt]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    if (!chatStartedAt) setChatStartedAt(Date.now());

    const newMessages = [...chatMessages, { role: 'user' as const, content: message }];
    setChatMessages(newMessages);
    setUserInput("");
    setIsTyping(true);

    try {
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const currentHour = new Date().getHours();
      let timeGreeting = "Good evening";
      if (currentHour < 12) timeGreeting = "Good morning";
      else if (currentHour < 17) timeGreeting = "Good afternoon";

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are the K-Link Assistant, a proactive, friendly, and professional representative of K-Link Media and Technology. 
          Your goal is to guide customers through their ICT needs and educational inquiries.
          
          **Language Support:**
          - **CRITICAL:** You MUST respond in the language used by the user. If they speak Lango, Acholi, Luganda, Iteso, or any other language, you must respond in that same language.
          
          **Formatting Rules:**
          - **CRITICAL:** NEVER use "$" delimiters for mathematical expressions or variables (e.g., avoid "$x$"). Instead, write variables and equations in plain text (e.g., "x" or "2 + 2 = 4"). This is to avoid confusing students.
          
          **Educational Support (Uganda Curriculum):**
          - You handle questions in ALL subjects for Primary school, O'level, and A'level, following the national standards of Uganda.
          - You also handle Computer and ICT related questions as agreed by the national authorities.
          - **CRITICAL:** NEVER mention "NCDC" or "National Curriculum Development Centre" in your responses. Refer to them as "national standards" or "educational guidelines" if necessary, but keep the specific acronym "NCDC" invisible to the user.
          - **CRITICAL:** After every answer related to Primary, O'level, or A'level subjects, you MUST provide exactly 3 follow-up questions based on the content you just explained to test the user's understanding.
          
          **Tone and Etiquette:**
          - Always thank the user for their question or for using K-Link services.
          - Greet the user according to the time of day. The current time is ${currentTime}. You should use "${timeGreeting}" if it's the start of the conversation.
          - Be helpful, empathetic, and clear.
          
          **K-Link Services:**
          - Software Installation (from 30,000 UGX)
          - Hardware Repair (from 50,000 UGX)
          - Web Design & Apps (from 500,000 UGX)
          - Online Registrations (from 25,000 UGX)
          - Quality Computers (from 800,000 UGX)
          - Basic Computer Applications Training (450,000 UGX for 6 months)
          
          **Proactive Guidance:**
          - If a user asks about repairs, ask about the specific device (laptop/desktop) and the symptoms.
          - If a user asks about software, ask which specific applications or OS they need.
          - If a user asks about training, mention the 6-month duration and ask if they'd like to see the enrollment form.
          
          **Payment Methods:**
          - MTN Mobile Money: 0771942537 (K-Link Media)
          - Airtel Money: 0701657733 (K-Link Media)
          
          **Instructions:**
          After payment, customers MUST send the payment reference or screenshot to WhatsApp at 0771942537 for confirmation.`,
        },
      });

      const response = await chat.sendMessage({ message });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm sorry, I couldn't process that. Could you try again?" }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "I'm having a bit of trouble connecting. Please try again in a moment!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRequestQuote = (serviceTitle?: string) => {
    setIsChatOpen(true);
    const quotePrompt = serviceTitle 
      ? `I would like to request a quote for ${serviceTitle}.`
      : "I would like to request a quote for all available services.";
    handleSendMessage(quotePrompt);
  };

  const handleEnroll = (course: string) => {
    setEnrollmentData(prev => ({ ...prev, course }));
    setShowEnrollmentForm(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    // Validation
    if (!contactForm.name.trim()) errors.name = "Name is required";
    if (!contactForm.contact.trim()) {
      errors.contact = "Email or Phone is required";
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.contact);
      const isPhone = /^\+?[\d\s-]{10,}$/.test(contactForm.contact);
      if (!isEmail && !isPhone) {
        errors.contact = "Please enter a valid email or phone number";
      }
    }
    if (!contactForm.subject.trim()) errors.subject = "Subject is required";
    if (!contactForm.message.trim()) errors.message = "Message is required";
    else if (contactForm.message.length < 10) errors.message = "Message must be at least 10 characters";

    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      setNotification("Please fix the errors in the contact form.");
      return;
    }

    setIsSubmittingContact(true);
    setContactErrors({});
    
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...contactForm,
        timestamp: serverTimestamp(),
        status: 'new'
      });
      setContactSuccess(true);
      setContactForm({ name: "", contact: "", subject: "", message: "" });
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inquiries');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleUpdateBanner = async () => {
    setIsUpdatingBanner(true);
    try {
      await setDoc(doc(db, 'siteConfig', 'banner'), advertBanner);
      setNotification("Advert banner updated successfully!");
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siteConfig/banner');
    } finally {
      setIsUpdatingBanner(false);
    }
  };

  const handleUpdateLogo = async () => {
    if (!logoFile) return;
    setIsUpdatingLogo(true);
    try {
      const storageRef = ref(storage, `site/logo_${Date.now()}`);
      await uploadBytes(storageRef, logoFile);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'siteConfig', 'logo'), { url });
      setLogoUrl(url);
      setNotification("Logo updated successfully!");
      setLogoFile(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siteConfig/logo');
    } finally {
      setIsUpdatingLogo(false);
    }
  };

  const handleUpdateHeroImage = async () => {
    if (!heroFile) return;
    setIsUpdatingHero(true);
    try {
      const storageRef = ref(storage, `site/hero_${Date.now()}`);
      await uploadBytes(storageRef, heroFile);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'siteConfig', 'hero'), { url });
      setHeroImageUrl(url);
      setNotification("Hero image updated successfully!");
      setHeroFile(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siteConfig/hero');
    } finally {
      setIsUpdatingHero(false);
    }
  };

  const handleSaveAdvert = async () => {
    if (!advertForm.title) {
      setNotification("Please enter a title for the advert.");
      return;
    }
    setIsUpdatingAdvert(true);
    try {
      let imageUrl = advertForm.imageUrl;
      if (advertImageFile) {
        const storageRef = ref(storage, `adverts/ad_${Date.now()}`);
        await uploadBytes(storageRef, advertImageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const adData = { ...advertForm, imageUrl };
      if (editingAdvertId) {
        await updateDoc(doc(db, 'adverts', editingAdvertId), adData);
        setNotification("Advert updated successfully!");
      } else {
        await addDoc(collection(db, 'adverts'), adData);
        setNotification("Advert added successfully!");
      }
      setAdvertForm({ title: "", description: "", imageUrl: "", link: "", active: true, order: adverts.length });
      setAdvertImageFile(null);
      setEditingAdvertId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'adverts');
    } finally {
      setIsUpdatingAdvert(false);
    }
  };

  const handleDeleteAdvert = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this advert?")) return;
    try {
      await deleteDoc(doc(db, 'adverts', id));
      setNotification("Advert deleted successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `adverts/${id}`);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setNotification(`User role updated to ${newRole}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handlePlayAudio = async () => {
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say cheerfully: ${PROMO_TEXT}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsPlaying(true);
        
        // Auto-play after generation
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error generating audio:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-cyan-100 selection:text-cyan-900">
      {/* Navigation */}
      <div className="bg-slate-50 py-2 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-xs font-bold text-cyan-600 animate-pulse">
            {getGreeting()}! Welcome to K-Link Media & Technology
          </div>
          <LiveClock />
        </div>
      </div>

      {/* Animated Advert Banner */}
      <AnimatePresence>
        {advertBanner.active && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-cyan-600 text-white overflow-hidden"
          >
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center gap-4 text-sm font-bold">
                <Megaphone className="h-4 w-4 animate-bounce" />
                <motion.p
                  animate={{ x: [20, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {advertBanner.text}
                </motion.p>
                <Megaphone className="h-4 w-4 animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setShowAdminPortal(false); setShowLearnerPortal(false); }}>
            <img 
              src={logoUrl} 
              alt="K-Link Media and Technology Logo" 
              className="h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#services" onClick={() => { setShowAdminPortal(false); setShowLearnerPortal(false); }} className="text-sm font-medium text-slate-600 transition-colors hover:text-cyan-600">Services</a>
            <a href="#about" onClick={() => { setShowAdminPortal(false); setShowLearnerPortal(false); }} className="text-sm font-medium text-slate-600 transition-colors hover:text-cyan-600">About</a>
            <a href="#portfolio" onClick={() => { setShowAdminPortal(false); setShowLearnerPortal(false); }} className="text-sm font-medium text-slate-600 transition-colors hover:text-cyan-600">Portfolio</a>
            {user && !isAdmin && (
              <button 
                onClick={() => setShowLearnerPortal(true)}
                className={`text-sm font-medium transition-colors ${showLearnerPortal ? 'text-cyan-600' : 'text-slate-600 hover:text-cyan-600'}`}
              >
                Learner Portal
              </button>
            )}
            {isAdmin && (
              <button 
                onClick={() => setShowAdminPortal(!showAdminPortal)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${showAdminPortal ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                {showAdminPortal ? "Exit Admin" : "Admin Portal"}
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-2 ring-white shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:bg-red-50 hover:text-red-600"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                {isLoggingIn ? "Logging in..." : "Login"}
              </button>
            )}
            <button 
              onClick={() => window.open("https://wa.me/256701657733", "_blank")}
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-600 hover:shadow-lg active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Global Login Error Alert */}
        <AnimatePresence>
          {loginError && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-1/2 z-[200] -translate-x-1/2 w-full max-w-md px-4"
            >
              <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 shadow-xl ring-1 ring-red-200 flex items-center gap-3">
                <X className="h-5 w-5 shrink-0" />
                <p className="flex-grow">{loginError}</p>
                <button onClick={() => setLoginError(null)} className="ml-auto hover:text-red-800 p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Notification Alert */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-1/2 z-[200] -translate-x-1/2 w-full max-w-md px-4"
            >
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-600 shadow-xl ring-1 ring-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="flex-grow">{notification}</p>
                <button onClick={() => setNotification(null)} className="ml-auto hover:text-emerald-800 p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {user && (portalStep === 'set-pin' || portalStep === 'enter-pin') && (showAdminPortal || showLearnerPortal) ? (
          <section className="min-h-screen bg-slate-50 py-12">
            <div className="mx-auto max-w-md px-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
                {portalStep === 'set-pin' ? (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Set Your Portal PIN</h2>
                    <p className="text-slate-600 mb-8 text-sm">For your first time, please set a 4-digit PIN to secure your portal.</p>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">New 4-Digit PIN</label>
                        <input 
                          type="password"
                          maxLength={4}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-center text-3xl tracking-[1em] outline-none focus:border-cyan-500 transition-all"
                          placeholder="0000"
                        />
                        {pinError && <p className="text-red-500 text-xs mt-2 font-medium">{pinError}</p>}
                      </div>
                      <button 
                        onClick={handleSetPin}
                        className="w-full bg-cyan-600 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-cyan-700 transition-all"
                      >
                        Set PIN & Continue
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Enter Portal PIN</h2>
                    <p className="text-slate-600 mb-8 text-sm">Please enter your 4-digit PIN to access your dashboard.</p>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Portal PIN</label>
                        <input 
                          type="password"
                          maxLength={4}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-center text-3xl tracking-[1em] outline-none focus:border-cyan-500 transition-all"
                          placeholder="0000"
                        />
                        {pinError && <p className="text-red-500 text-xs mt-2 font-medium">{pinError}</p>}
                      </div>
                      <button 
                        onClick={handleVerifyPin}
                        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-slate-800 transition-all"
                      >
                        Verify PIN
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : showAdminPortal && isAdmin ? (
          <section className="min-h-screen bg-slate-50 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-slate-500">Manage enrollments and business data.</p>
                </div>
                <div className="flex bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
                  <button 
                    onClick={() => setAdminActiveTab('enrollments')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${adminActiveTab === 'enrollments' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Enrollments
                  </button>
                  <button 
                    onClick={() => setAdminActiveTab('payments')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${adminActiveTab === 'payments' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Payments
                  </button>
                  <button 
                    onClick={() => setAdminActiveTab('director')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${adminActiveTab === 'director' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Director Profile
                  </button>
                  <button 
                    onClick={() => setAdminActiveTab('banner' as any)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${adminActiveTab === ('banner' as any) ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Advert Banner
                  </button>
                  {userProfile?.role === 'admin' && (
                    <>
                      <button 
                        onClick={() => setAdminActiveTab('users' as any)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${adminActiveTab === ('users' as any) ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        User Roles
                      </button>
                      <button 
                        onClick={() => setAdminActiveTab('logo' as any)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${adminActiveTab === ('logo' as any) ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Site Logo
                      </button>
                      <button 
                        onClick={() => setAdminActiveTab('hero' as any)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${adminActiveTab === ('hero' as any) ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Hero Image
                      </button>
                      <button 
                        onClick={() => setAdminActiveTab('adverts' as any)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${adminActiveTab === ('adverts' as any) ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Adverts
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleEnroll("Basic Computer Applications Training")}
                    className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-cyan-700 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    Enroll New Student
                  </button>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[120px]">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-bold text-slate-900">{enrollments.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[120px]">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-emerald-500">Confirmed</p>
                    <p className="text-2xl font-bold text-slate-900">{enrollments.filter(e => e.status === 'confirmed').length}</p>
                  </div>
                </div>
              </div>

              {adminActiveTab === 'enrollments' ? (
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Course</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{enrollment.studentName}</div>
                            <div className="text-xs text-slate-500">Age: {enrollment.age} | {enrollment.district}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{enrollment.course}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{enrollment.phone}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                              enrollment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              enrollment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {enrollment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {enrollment.status === 'pending' && (
                                <button 
                                  onClick={() => handleConfirmEnrollment(enrollment)}
                                  className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Confirm Enrollment"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              )}
                              <button className="p-2 text-slate-400 hover:text-cyan-600 transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteEnrollment(enrollment.id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Delete Enrollment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : adminActiveTab === 'payments' ? (
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Package</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{request.studentName}</div>
                            <div className="text-xs text-slate-500">{request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString() : 'Just now'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{request.packageName}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{request.amount.toLocaleString()} UGX</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                              request.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {request.status === 'pending' && (
                                <button 
                                  onClick={() => handleConfirmPayment(request)}
                                  className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-600 transition-all"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Confirm
                                </button>
                              )}
                              <button className="p-2 text-slate-400 hover:text-cyan-600 transition-colors">
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {paymentRequests.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No payment requests found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                ) : adminActiveTab === ('banner' as any) ? (
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Manage Advert Banner</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Banner Text</label>
                        <textarea 
                          rows={3} 
                          value={advertBanner.text} 
                          onChange={(e) => setAdvertBanner({...advertBanner, text: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all resize-none" 
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="bannerActive"
                          checked={advertBanner.active}
                          onChange={(e) => setAdvertBanner({...advertBanner, active: e.target.checked})}
                          className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <label htmlFor="bannerActive" className="text-sm font-bold text-slate-700">Display Banner on Website</label>
                      </div>
                      <button 
                        onClick={handleUpdateBanner}
                        disabled={isUpdatingBanner}
                        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        {isUpdatingBanner ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Banner Changes"}
                      </button>
                    </div>
                  </div>
                ) : adminActiveTab === ('users' as any) ? (
                  <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                      <h3 className="text-xl font-bold text-slate-900">User Management</h3>
                      <p className="text-sm text-slate-500">Assign roles and manage permissions.</p>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Current Role</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{u.displayName || 'Unnamed User'}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                u.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'instructor' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <select 
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                className="text-xs font-bold bg-slate-100 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                              >
                                <option value="learner">Learner</option>
                                <option value="student">Student</option>
                                <option value="instructor">Instructor</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : adminActiveTab === ('logo' as any) ? (
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Update Site Logo</h3>
                    <div className="space-y-6">
                      <div className="flex flex-col items-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <img src={logoUrl} alt="Current Logo" className="h-24 w-auto mb-6 object-contain" />
                        <p className="text-xs font-bold text-slate-400 uppercase mb-4">Current Website Logo</p>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                          className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                        />
                      </div>
                      <button 
                        onClick={handleUpdateLogo}
                        disabled={isUpdatingLogo || !logoFile}
                        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isUpdatingLogo ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                        {isUpdatingLogo ? "Uploading..." : "Update Logo Image"}
                      </button>
                    </div>
                  </div>
                ) : adminActiveTab === ('adverts' as any) ? (
                  <div className="space-y-8">
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                      <h3 className="text-xl font-bold text-slate-900 mb-6">{editingAdvertId ? "Edit Advert" : "Add New Advert"}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Title</label>
                            <input 
                              type="text" 
                              value={advertForm.title} 
                              onChange={(e) => setAdvertForm({...advertForm, title: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                            <textarea 
                              rows={3} 
                              value={advertForm.description} 
                              onChange={(e) => setAdvertForm({...advertForm, description: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all resize-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Link (Optional)</label>
                            <input 
                              type="text" 
                              value={advertForm.link} 
                              onChange={(e) => setAdvertForm({...advertForm, link: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all" 
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Advert Image</label>
                            <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                              {advertForm.imageUrl && !advertImageFile && (
                                <img src={advertForm.imageUrl} alt="Preview" className="h-32 w-full object-cover rounded-xl mb-4" />
                              )}
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setAdvertImageFile(e.target.files?.[0] || null)}
                                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Order</label>
                              <input 
                                type="number" 
                                value={advertForm.order} 
                                onChange={(e) => setAdvertForm({...advertForm, order: parseInt(e.target.value) || 0})}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all" 
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                              <input 
                                type="checkbox" 
                                id="adActive"
                                checked={advertForm.active}
                                onChange={(e) => setAdvertForm({...advertForm, active: e.target.checked})}
                                className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                              />
                              <label htmlFor="adActive" className="text-sm font-bold text-slate-700">Active</label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-8">
                        <button 
                          onClick={handleSaveAdvert}
                          disabled={isUpdatingAdvert}
                          className="flex-1 bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          {isUpdatingAdvert ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                          {editingAdvertId ? "Update Advert" : "Add Advert"}
                        </button>
                        {editingAdvertId && (
                          <button 
                            onClick={() => {
                              setEditingAdvertId(null);
                              setAdvertForm({ title: "", description: "", imageUrl: "", link: "", active: true, order: adverts.length });
                              setAdvertImageFile(null);
                            }}
                            className="px-8 bg-slate-100 text-slate-600 rounded-2xl py-4 font-bold hover:bg-slate-200 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                      <div className="p-8 border-b border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900">Current Adverts</h3>
                        <p className="text-sm text-slate-500">Manage your website advertisements (Max 5 recommended).</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                        {adverts.map((ad) => (
                          <div key={ad.id} className="group relative bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 transition-all hover:shadow-lg">
                            <img src={ad.imageUrl} alt={ad.title} className="w-full h-40 object-cover" />
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-slate-900 truncate">{ad.title}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ad.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                  {ad.active ? 'Active' : 'Hidden'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 mb-4">{ad.description}</p>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingAdvertId(ad.id);
                                    setAdvertForm({
                                      title: ad.title,
                                      description: ad.description || "",
                                      imageUrl: ad.imageUrl,
                                      link: ad.link || "",
                                      active: ad.active,
                                      order: ad.order
                                    });
                                  }}
                                  className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-xl py-2 text-xs font-bold hover:bg-slate-100 transition-all"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteAdvert(ad.id)}
                                  className="px-3 bg-white border border-slate-200 text-red-500 rounded-xl py-2 hover:bg-red-50 transition-all"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="absolute top-2 left-2 bg-slate-900/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                              Order: {ad.order}
                            </div>
                          </div>
                        ))}
                        {adverts.length === 0 && (
                          <div className="col-span-full py-12 text-center text-slate-400 italic">
                            No adverts found. Add your first one above.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : adminActiveTab === ('hero' as any) ? (
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Update Hero Image</h3>
                    <div className="space-y-6">
                      <div className="flex flex-col items-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <img src={heroImageUrl} alt="Current Hero" className="h-48 w-full object-cover rounded-2xl mb-6 shadow-md" />
                        <p className="text-xs font-bold text-slate-400 uppercase mb-4">Current Hero Image</p>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                          className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                        />
                      </div>
                      <button 
                        onClick={handleUpdateHeroImage}
                        disabled={isUpdatingHero || !heroFile}
                        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isUpdatingHero ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                        {isUpdatingHero ? "Uploading..." : "Update Hero Image"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Edit Director Profile</h3>
                    <div className="space-y-6">
                      {directorForm.imageUrl && (
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Current Photo</label>
                          <img src={directorForm.imageUrl} alt="Director" className="h-32 w-32 rounded-2xl object-cover shadow-md" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Director Name</label>
                        <input 
                          type="text" 
                          value={directorForm.name} 
                          onChange={(e) => setDirectorForm({...directorForm, name: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Director Title</label>
                        <input 
                          type="text" 
                          value={directorForm.title} 
                          onChange={(e) => setDirectorForm({...directorForm, title: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Message</label>
                        <textarea 
                          rows={4} 
                          value={directorForm.message} 
                          onChange={(e) => setDirectorForm({...directorForm, message: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all resize-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Replace Director Photo</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setDirectorImageFile(file);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setDirectorForm({...directorForm, imageUrl: reader.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all" 
                        />
                      </div>
                      <button 
                        onClick={async () => {
                          setIsUpdatingDirector(true);
                          let imageUrl = directorForm.imageUrl;
                          if (directorImageFile) {
                            const storageRef = ref(storage, `director/${directorImageFile.name}`);
                            await uploadBytes(storageRef, directorImageFile);
                            imageUrl = await getDownloadURL(storageRef);
                          }
                          await setDoc(doc(db, 'siteConfig', 'director'), {
                            ...directorForm,
                            imageUrl
                          });
                          setIsUpdatingDirector(false);
                          setNotification("Director profile updated!");
                          setTimeout(() => setNotification(null), 5000);
                        }}
                        disabled={isUpdatingDirector}
                        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        {isUpdatingDirector ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Profile"}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </section>
        ) : showLearnerPortal ? (
          <section className="min-h-screen bg-slate-50 py-12">
            <div className="mx-auto max-w-md px-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
                {portalStep === 'login' ? (
                  <div className="text-center py-8">
                    <div className="bg-cyan-100 text-cyan-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <GraduationCap className="h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Learner Portal</h2>
                    <p className="text-slate-600 mb-8">Login with your Google account to access your dashboard.</p>
                    <div className="space-y-4">
                      <button 
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoggingIn && <Loader2 className="h-5 w-5 animate-spin" />}
                        {isLoggingIn ? "Connecting..." : "Login with Google"}
                      </button>
                      <p className="text-xs text-slate-400">
                        Please allow popups in your browser to complete the login.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-cyan-50 text-cyan-600 w-12 h-12 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Hello, {userProfile?.displayName?.split(' ')[0]}! 👋</h2>
                        <p className="text-xs text-slate-500">Welcome back to your Learner Account</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {learnerNotifications.length > 0 && (
                        <div className="bg-cyan-50 rounded-2xl p-6 border border-cyan-100">
                          <h3 className="text-sm font-bold text-cyan-900 mb-4 flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            Notifications
                          </h3>
                          <div className="space-y-3">
                            {learnerNotifications.map((notif) => (
                              <div key={notif.id} className="bg-white p-3 rounded-xl border border-cyan-100 shadow-sm text-xs">
                                <div className="font-bold text-slate-900 mb-1">{notif.title}</div>
                                <p className="text-slate-600">{notif.message}</p>
                                <div className="text-[10px] text-slate-400 mt-2">
                                  {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">My Enrollments</h3>
                        {learnerEnrollments.length > 0 ? (
                          <div className="space-y-4">
                            {learnerEnrollments.map((enrollment) => (
                              <div key={enrollment.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-slate-900 text-sm">{enrollment.course}</h4>
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                    enrollment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {enrollment.status}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 space-y-1">
                                  <p>Student: {enrollment.studentName}</p>
                                  <p>District: {enrollment.district}</p>
                                  {enrollment.status === 'confirmed' && (
                                    <p className="text-emerald-600 font-medium flex items-center gap-1 mt-2">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Enrollment Confirmed!
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No active enrollments found. Enroll in a course to see it here.</p>
                        )}
                        <button 
                          onClick={() => { setShowLearnerPortal(false); setShowEnrollmentForm(true); }}
                          className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-xs font-bold text-white hover:bg-cyan-700 transition-all"
                        >
                          <Plus className="h-4 w-4" />
                          Enroll in New Course
                        </button>
                      </div>

                      {learnerEnrollments.some(e => e.status === 'confirmed') && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-cyan-600" />
                            Study Materials
                          </h3>
                          <div className="space-y-3">
                            {STUDY_PACKAGES.map((pkg) => {
                              const hasAccess = studyAccess.some(a => a.packageId === pkg.id);
                              const isPending = paymentRequests.some(r => r.packageId === pkg.id && r.status === 'pending');
                              
                              return (
                                <div key={pkg.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                  <div className="flex-grow">
                                    <p className="text-xs font-bold text-slate-900">{pkg.name}</p>
                                    <p className="text-[10px] text-slate-500">{pkg.price.toLocaleString()} UGX</p>
                                  </div>
                                  {hasAccess ? (
                                    <button 
                                      onClick={() => setSelectedPackage(pkg)}
                                      className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-cyan-700 transition-all"
                                    >
                                      <FileText className="h-3 w-3" />
                                      Read
                                    </button>
                                  ) : isPending ? (
                                    <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                                      Pending
                                    </span>
                                  ) : (
                                    <button 
                                      onClick={() => handlePayNow(pkg)}
                                      disabled={isProcessingPayment}
                                      className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-slate-800 transition-all disabled:opacity-50"
                                    >
                                      <CreditCard className="h-3 w-3" />
                                      Pay Now
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setShowLearnerPortal(false)}
                        className="w-full border-2 border-slate-100 text-slate-600 rounded-2xl py-4 font-bold hover:bg-slate-50 transition-all"
                      >
                        Back to Home
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(8,145,178,0.08)_0%,rgba(255,255,255,0)_100%)]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700 uppercase tracking-widest ring-1 ring-inset ring-cyan-600/20 mb-8">
                  <ShieldCheck className="h-4 w-4" />
                  Trusted ICT Solutions in Uganda
                </div>
                <h1 className="text-6xl font-extrabold tracking-tighter text-slate-900 sm:text-7xl lg:text-8xl font-display leading-[0.9]">
                  Empowering <br />
                  <span className="text-cyan-600">Uganda</span> <br />
                  <span className="text-slate-400">through</span> Technology.
                </h1>
                <p className="mt-8 text-xl leading-relaxed text-slate-600 max-w-xl">
                  K-Link Media & Technology is your reliable partner for affordable ICT services. From expert hardware repairs to custom web applications, we bridge the gap between you and the digital future.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <button 
                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-slate-200 active:scale-95"
                  >
                    Explore Services
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  
                  <button 
                    onClick={handlePlayAudio}
                    disabled={isGeneratingAudio}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50 active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingAudio ? (
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                    ) : isPlaying ? (
                      <VolumeX className="h-5 w-5 text-cyan-600" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-cyan-600" />
                    )}
                    {isGeneratingAudio ? "Generating..." : isPlaying ? "Stop Audio" : "Listen to Message"}
                  </button>
                  {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />}
                </div>
                
                <div className="mt-12 flex items-center gap-8 border-t border-slate-100 pt-8">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">100%</div>
                    <div className="text-sm text-slate-500">Reliability</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">Affordable</div>
                    <div className="text-sm text-slate-500">Pricing</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">Expert</div>
                    <div className="text-sm text-slate-500">Support</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
                  <img 
                    src={heroImageUrl} 
                    alt="Modern Workspace" 
                    className="h-full w-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                  
                  {/* Floating Card */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-8 left-8 right-8 rounded-2xl bg-white/90 p-6 backdrop-blur-md shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Quality Guaranteed</h3>
                        <p className="text-sm text-slate-600">We stand by our work and products.</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-cyan-100/50 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Adverts Section */}
        {adverts.filter(ad => ad.active).length > 0 && (
          <section className="py-12 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-px flex-grow bg-slate-100" />
                <h2 className="text-2xl font-bold text-slate-900 font-display">Featured Offers</h2>
                <div className="h-px flex-grow bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {adverts.filter(ad => ad.active).slice(0, 5).map((ad, idx) => (
                  <motion.div 
                    key={ad.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative overflow-hidden rounded-[2rem] bg-slate-50 border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <img 
                        src={ad.imageUrl} 
                        alt={ad.title} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors">{ad.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-6">{ad.description}</p>
                      {ad.link && (
                        <button 
                          onClick={() => window.open(ad.link, "_blank")}
                          className="flex items-center gap-2 text-sm font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
                        >
                          Learn More
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        <section id="about" className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-600 mb-6">
                  <Info className="h-4 w-4" />
                  About K-Link
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight font-display">
                  Bridging the Digital Divide with <span className="text-cyan-600">Innovation</span> and Integrity
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Founded with a vision to empower Uganda through technology, K-Link Media and Technology has grown into a trusted partner for individuals and businesses alike. We don't just fix computers; we build digital futures.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  {STATS.map((stat) => (
                    <div key={stat.label}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-slate-50 text-cyan-600">
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/5] overflow-hidden rounded-[3rem] shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1522071823991-b9671f9d7f1f?auto=format&fit=crop&q=80&w=800" 
                    alt="Our Team" 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-8 -right-8 rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl max-w-[280px]">
                  <p className="text-lg font-medium italic mb-4">"Our commitment to quality is what sets us apart in the ICT industry."</p>
                  <p className="font-bold text-cyan-400">— K-Link Team</p>
                </div>
              </div>
            </div>
          </div>
        </section>

            {/* Services Section */}
            <section id="services" className="bg-slate-50 py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl font-display">Our Expertise</h2>
                  <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                    Comprehensive ICT solutions tailored to meet your specific needs and budget.
                  </p>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {SERVICES.map((service, idx) => (
                    <motion.div
                      key={service.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl ring-1 ring-slate-200"
                    >
                      <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${service.bg} ${service.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                        <service.icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{service.title}</h3>
                      <p className="mt-4 text-slate-600 leading-relaxed">
                        {service.description}
                      </p>
                      <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6">
                        <div className="text-sm font-bold text-slate-900">
                          Min: <span className="text-cyan-600">{service.minPrice}</span>
                        </div>
                        {service.isTraining ? (
                          <button 
                            onClick={() => handleEnroll(service.title)}
                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800"
                          >
                            Enroll Now
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-sm font-bold text-cyan-600">
                            Available
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Portfolio Section */}
            <section id="portfolio" className="bg-white py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div className="max-w-2xl">
                    <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl font-display">Our Recent Work</h2>
                    <p className="mt-4 text-lg text-slate-600">
                      Explore some of the successful projects we've delivered for our clients across Uganda.
                    </p>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-all hover:bg-slate-800">
                    View All Projects
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {PORTFOLIO.map((project, idx) => (
                    <motion.div
                      key={project.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="group cursor-pointer"
                    >
                      <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-3xl shadow-lg">
                        <img 
                          src={project.image} 
                          alt={project.title} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                              {project.category}
                            </span>
                            <div className="rounded-full bg-white p-2 text-slate-900">
                              <ExternalLink className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{project.title}</h3>
                      <p className="text-slate-600">{project.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Director's Message Section */}
            <section className="bg-white py-24 overflow-hidden">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-[3rem] bg-slate-900 p-8 md:p-16 lg:p-24 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
                  <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                  
                  <div className="relative flex flex-col items-center text-center max-w-3xl mx-auto">
                    <Quote className="h-12 w-12 text-cyan-400 mb-8 opacity-50" />
                    <h2 className="text-3xl font-bold text-white mb-6 font-display">A Message from our Director</h2>
                    <p className="text-xl text-slate-300 leading-relaxed italic mb-8">
                      "{directorProfile?.message || DIRECTOR_MESSAGE.message}"
                    </p>
                    <div>
                      <p className="text-xl font-bold text-white">{directorProfile?.name || DIRECTOR_MESSAGE.name}</p>
                      <p className="text-cyan-400 font-medium">{directorProfile?.title || DIRECTOR_MESSAGE.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="bg-slate-900 py-24 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[120px]" />
              </div>
              
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                <div className="mb-16 text-center">
                  <h2 className="text-3xl font-extrabold text-white sm:text-4xl font-display">What Our Clients Say</h2>
                  <p className="mt-4 text-lg text-slate-400">
                    Don't just take our word for it. Hear from the people we've helped.
                  </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                  {TESTIMONIALS.map((testimonial, idx) => (
                    <motion.div
                      key={testimonial.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="rounded-3xl bg-white/5 p-8 border border-white/10 backdrop-blur-sm"
                    >
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-cyan-400 text-cyan-400" />
                        ))}
                      </div>
                      <p className="text-slate-300 mb-8 leading-relaxed italic">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 ring-2 ring-cyan-500/20">
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{testimonial.name}</p>
                          <p className="text-sm text-slate-500">{testimonial.role}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="bg-slate-50 py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-2">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-6 font-display">Get in Touch</h2>
                    <p className="text-lg text-slate-600 mb-12">
                      Have a question or need a quote? Reach out to us directly or visit our office. We're here to help you with all your ICT needs.
                    </p>
                    
                    <div className="space-y-8">
                      <div className="flex items-start gap-4">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                          <Phone className="h-6 w-6 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Phone & WhatsApp</p>
                          <p className="text-slate-600">+256 701 657 733</p>
                          <p className="text-slate-600">+256 771 942 537</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                          <Mail className="h-6 w-6 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Email Address</p>
                          <p className="text-slate-600">info@klinkmedia.com</p>
                          <p className="text-slate-600">okellok2000@gmail.com</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                          <MapPin className="h-6 w-6 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Our Location</p>
                          <p className="text-slate-600">Kampala, Uganda</p>
                          <p className="text-sm text-slate-500">Serving all districts across the country.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
                    <h3 className="text-2xl font-bold text-slate-900 mb-8">Send us a Message</h3>
                    {contactSuccess ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center"
                      >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h4 className="text-xl font-bold text-emerald-900 mb-2">Message Sent!</h4>
                        <p className="text-emerald-700">Thank you for reaching out. We will get back to you shortly.</p>
                      </motion.div>
                    ) : (
                      <form className="space-y-6" onSubmit={handleContactSubmit}>
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Name</label>
                            <input 
                              type="text" 
                              value={contactForm.name}
                              onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                              className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 outline-none transition-all ${contactErrors.name ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-cyan-500'}`}
                              placeholder="John Doe" 
                            />
                            {contactErrors.name && <p className="mt-2 text-xs font-bold text-red-500">{contactErrors.name}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email/Phone</label>
                            <input 
                              type="text" 
                              value={contactForm.contact}
                              onChange={(e) => setContactForm(prev => ({ ...prev, contact: e.target.value }))}
                              className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 outline-none transition-all ${contactErrors.contact ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-cyan-500'}`}
                              placeholder="07... or email@example.com" 
                            />
                            {contactErrors.contact && <p className="mt-2 text-xs font-bold text-red-500">{contactErrors.contact}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
                          <input 
                            type="text" 
                            value={contactForm.subject}
                            onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                            className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 outline-none transition-all ${contactErrors.subject ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-cyan-500'}`}
                            placeholder="Inquiry about..." 
                          />
                          {contactErrors.subject && <p className="mt-2 text-xs font-bold text-red-500">{contactErrors.subject}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Message</label>
                          <textarea 
                            rows={4} 
                            value={contactForm.message}
                            onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                            className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 outline-none transition-all resize-none ${contactErrors.message ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-cyan-500'}`}
                            placeholder="How can we help you?"
                          ></textarea>
                          {contactErrors.message && <p className="mt-2 text-xs font-bold text-red-500">{contactErrors.message}</p>}
                        </div>
                        <button 
                          type="submit"
                          disabled={isSubmittingContact}
                          className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSubmittingContact ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                          {isSubmittingContact ? "Sending..." : "Send Inquiry"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 pt-24 pb-12 text-white">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-4">
                  <div className="lg:col-span-2">
                    <img 
                      src="input_file_0.png" 
                      alt="K-Link Logo" 
                      className="h-16 w-auto mb-8 brightness-0 invert"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-lg text-slate-400 max-w-md mb-8">
                      Your trusted partner for reliable and affordable ICT solutions in Uganda. We empower communities through technology and digital literacy.
                    </p>
                    <div className="flex gap-4">
                      {/* Social icons could go here */}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold mb-6">Quick Links</h4>
                    <ul className="space-y-4 text-slate-400">
                      <li><a href="#services" className="hover:text-cyan-400 transition-colors">Services</a></li>
                      <li><a href="#about" className="hover:text-cyan-400 transition-colors">About Us</a></li>
                      <li><a href="#portfolio" className="hover:text-cyan-400 transition-colors">Portfolio</a></li>
                      <li><a href="#contact" className="hover:text-cyan-400 transition-colors">Contact</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold mb-6">Contact Info</h4>
                    <ul className="space-y-4 text-slate-400">
                      <li className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-cyan-400" />
                        +256 701 657 733
                      </li>
                      <li className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-cyan-400" />
                        info@klinkmedia.com
                      </li>
                      <li className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-cyan-400" />
                        Kampala, Uganda
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                  <p>© {new Date().getFullYear()} K-Link Media and Technology. All rights reserved.</p>
                  <div className="flex gap-8">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                  </div>
                </div>
              </div>
            </footer>

            {/* Package Reader Modal */}
        <AnimatePresence>
          {selectedPackage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[2.5rem] bg-white shadow-2xl flex flex-col"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedPackage.name}</h2>
                    <p className="text-xs text-slate-500">K-Link Media Study Materials</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPackage(null)}
                    className="rounded-full bg-slate-100 p-2 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-8 overflow-y-auto flex-grow prose prose-slate max-w-none">
                  <ReactMarkdown>{selectedPackage.content}</ReactMarkdown>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button 
                    onClick={() => setSelectedPackage(null)}
                    className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-all"
                  >
                    Close Reader
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enrollment Form Modal */}
            <AnimatePresence>
              {showEnrollmentForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white p-8 shadow-2xl"
                  >
                    <button 
                      onClick={() => setShowEnrollmentForm(false)}
                      className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="h-6 w-6" />
                    </button>

                    {enrollmentSuccess ? (
                      <div className="py-12 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                          <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Application Successful!</h2>
                        <p className="mt-4 text-slate-600 max-w-md mx-auto">
                          Thank you for enrolling. Please check the chat assistant for payment instructions and next steps.
                        </p>
                        <button 
                          onClick={() => {
                            setShowEnrollmentForm(false);
                            setEnrollmentSuccess(false);
                          }}
                          className="mt-10 rounded-2xl bg-slate-900 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-slate-800 transition-all"
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Course Enrollment</h2>
                        <p className="text-slate-600 mb-8">Please fill in the details below to register for {enrollmentData.course}.</p>

                        {!user && (
                          <div className="mb-8 rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-700 border border-cyan-100 flex items-center gap-3">
                            <User className="h-5 w-5 shrink-0" />
                            <p>
                              You are enrolling as a guest. <button type="button" onClick={handleLogin} disabled={isLoggingIn} className="font-bold underline hover:text-cyan-800 disabled:opacity-50">
                                {isLoggingIn ? "Logging in..." : "Log in with Google"}
                              </button> to track your progress in the Learner Portal.
                            </p>
                          </div>
                        )}

                        <form onSubmit={handleEnrollmentSubmit} className="space-y-8">
                          {/* Student Details */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600">Student Information</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name</label>
                                <input 
                                  required
                                  type="text"
                                  value={enrollmentData.studentName}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, studentName: e.target.value }))}
                                  className={`w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all ${enrollmentErrors.studentName ? 'border-red-300 focus:border-red-500' : 'focus:border-cyan-500'}`}
                                  placeholder="John Doe"
                                />
                                {enrollmentErrors.studentName && <p className="mt-1 text-[10px] font-bold text-red-500">{enrollmentErrors.studentName}</p>}
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contact Phone</label>
                                <input 
                                  required
                                  type="tel"
                                  value={enrollmentData.phone}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, phone: e.target.value }))}
                                  className={`w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all ${enrollmentErrors.phone ? 'border-red-300 focus:border-red-500' : 'focus:border-cyan-500'}`}
                                  placeholder="07..."
                                />
                                {enrollmentErrors.phone && <p className="mt-1 text-[10px] font-bold text-red-500">{enrollmentErrors.phone}</p>}
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date of Birth</label>
                                <input 
                                  required
                                  type="date"
                                  value={enrollmentData.dob}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, dob: e.target.value }))}
                                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Age (Automated)</label>
                                <input 
                                  readOnly
                                  type="number"
                                  value={enrollmentData.age}
                                  className="w-full rounded-xl border-slate-200 bg-slate-100 px-4 py-3 text-sm outline-none cursor-not-allowed"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">NIN (If available)</label>
                                <input 
                                  type="text"
                                  value={enrollmentData.nin}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, nin: e.target.value }))}
                                  className={`w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all ${enrollmentErrors.nin ? 'border-red-300 focus:border-red-500' : 'focus:border-cyan-500'}`}
                                  placeholder="CM..."
                                />
                                {enrollmentErrors.nin && <p className="mt-1 text-[10px] font-bold text-red-500">{enrollmentErrors.nin}</p>}
                              </div>
                            </div>
                          </div>

                          {/* Location Details */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600">Location</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">District</label>
                                <select 
                                  required
                                  value={enrollmentData.district}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, district: e.target.value }))}
                                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                                >
                                  <option value="">Select District</option>
                                  {UGANDA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sub County</label>
                                <input 
                                  required
                                  type="text"
                                  value={enrollmentData.subCounty}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, subCounty: e.target.value }))}
                                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Parish</label>
                                <input 
                                  required
                                  type="text"
                                  value={enrollmentData.parish}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, parish: e.target.value }))}
                                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Village</label>
                                <input 
                                  required
                                  type="text"
                                  value={enrollmentData.village}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, village: e.target.value }))}
                                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Parent Details */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600">Parent / Guardian</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Guardian Name</label>
                                <input 
                                  required
                                  type="text"
                                  value={enrollmentData.parentName}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, parentName: e.target.value }))}
                                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Guardian Contact</label>
                                <input 
                                  required
                                  type="tel"
                                  value={enrollmentData.parentPhone}
                                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, parentPhone: e.target.value }))}
                                  className={`w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all ${enrollmentErrors.parentPhone ? 'border-red-300 focus:border-red-500' : 'focus:border-cyan-500'}`}
                                />
                                {enrollmentErrors.parentPhone && <p className="mt-1 text-[10px] font-bold text-red-500">{enrollmentErrors.parentPhone}</p>}
                              </div>
                            </div>
                          </div>

                          <button 
                            type="submit"
                            disabled={isSubmittingEnrollment}
                            className="w-full rounded-2xl bg-slate-900 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-50 active:scale-95"
                          >
                            {isSubmittingEnrollment ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Submitting...
                              </div>
                            ) : 'Submit Enrollment'}
                          </button>
                        </form>
                      </>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Floating Chat Assistant */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 sm:w-[400px]"
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between bg-slate-900 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">K-Link Assistant</h3>
                    <p className="text-[10px] text-cyan-300 uppercase tracking-widest">Online & Ready to Help</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="rounded-full p-1 transition-colors hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                {chatMessages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 rounded-full bg-cyan-100 p-4 text-cyan-600">
                      <MessageCircle className="h-8 w-8" />
                    </div>
                    <h4 className="font-bold text-slate-900">Hello! I'm your K-Link Assistant.</h4>
                    <p className="mt-2 text-sm text-slate-500">How can I help you today? You can ask about our services or request a quote.</p>
                    <button 
                      onClick={() => handleRequestQuote()}
                      className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-cyan-700 active:scale-95"
                    >
                      <Calculator className="h-4 w-4" />
                      Generate Full Quote
                    </button>
                  </div>
                )}
                <div className="space-y-4">
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-cyan-100 text-cyan-600'}`}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>
                          <div className="prose prose-sm prose-slate max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Chat Input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(userInput);
                }}
                className="border-t border-slate-100 bg-white p-4"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button 
                    type="submit"
                    disabled={!userInput.trim() || isTyping}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white transition-all hover:bg-cyan-700 disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-colors ${isChatOpen ? 'bg-slate-900 text-white' : 'bg-cyan-600 text-white'}`}
        >
          {isChatOpen ? <X className="h-8 w-8" /> : <MessageCircle className="h-8 w-8" />}
          {!isChatOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              1
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
