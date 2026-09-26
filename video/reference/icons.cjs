// Render the lucide icons the app uses to plain SVG strings for the film.
// NODE_PATH=node_modules node video/reference/icons.cjs > video/icons.js
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const L = require('lucide-react');
const names = 'Presentation Banknote TreePalm UserCircle LayoutDashboard Inbox Users GraduationCap ClipboardList CalendarClock ListChecks SlidersHorizontal School CalendarCheck DoorOpen AlertTriangle Trophy CalendarRange Calculator Receipt CalendarDays BadgeDollarSign Wallet PiggyBank ArrowLeftRight Scale BarChart3 Shield Settings Sun Bell ChevronDown ChevronLeft ChevronRight Search Phone MessageSquarePlus LogOut Download Plus TrendingUp TrendingDown DollarSign Eye CreditCard CircleCheck CheckCircle2 ArrowLeft ArrowRight ClipboardCheck Menu Landmark X Calendar Lock FileText Paperclip ReceiptText HandCoins BadgePercent Bus Info CircleAlert CircleCheckBig'.split(' ');
const out = {};
for (const n of names) {
  if (!L[n]) { console.error('missing', n); continue; }
  out[n] = renderToStaticMarkup(React.createElement(L[n], { size: 24 })).replace(/ class="[^"]*"/, '');
}
process.stdout.write('/* Lucide icons (ISC licence), as used by the app. Generated from lucide-react. */\nwindow.ICONS = ' + JSON.stringify(out, null, 0).replace(/","/g, '",\n"') + ';\n');
