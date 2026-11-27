'use strict';

/**
 * Small DEMO dataset for ShebaKhoj.
 *
 * Every "name" below is a placeholder label, not a real person or business.
 * There are deliberately NO phone numbers, emails, addresses, or links.
 * Nothing here should be treated as a real-world provider.
 */

const categoryLabels = {
  electronics: 'বৈদ্যুতিক ও ইলেকট্রনিক',
  plumbing: 'প্লাম্বিং ও পানির কাজ',
  internet: 'ইন্টারনেট ও নেটওয়ার্ক',
  cleaning: 'পরিচ্ছন্নতা',
  painting: 'পেইন্ট ও দেওয়াল',
  pest_control: 'কীটনাশক ব্যবস্থা',
  carpentry: 'কাঠের কাজ',
  other: 'অন্যান্য',
};

const categoryOrder = Object.keys(categoryLabels);

const providers = [
  {
    id: 'demo-e1',
    category: 'electronics',
    name: 'ডেমো প্রদানকারী A',
    area: 'ডেমো এলাকা ১',
    specialties: ['ফ্যান মেরামত', 'বৈদ্যুতিক লাইন', 'সকেট ও লাইট'],
    keywords: ['ফ্যান', 'fan', 'বিদ্যু', 'electric', 'ওয়্যার', 'wiring', 'লাইট', 'light', 'সকেট', 'socket'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-e2',
    category: 'electronics',
    name: 'ডেমো প্রদানকারী B',
    area: 'ডেমো এলাকা ২',
    specialties: ['এসি সার্ভিস', 'ফ্রিজ মেরামত', 'ল্যাপটপ ও ফোন'],
    keywords: ['এসি', 'ac', 'ফ্রিজ', 'fridge', 'ল্যাপটপ', 'laptop', 'মোবাইল', 'mobile', 'কম্পিউটার', 'computer', 'রিপেয়ার', 'repair'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-p1',
    category: 'plumbing',
    name: 'ডেমো প্রদানকারী C',
    area: 'ডেমো এলাকা ৩',
    specialties: ['পাইপ ফুটো', 'নল ও ট্যাপ', 'বাথরুমের পানি'],
    keywords: ['পাইপ', 'pipe', 'নল', 'ট্যাপ', 'tap', 'ফুটো', 'leak', 'পানি', 'water', 'বাথরুম', 'bathroom'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-p2',
    category: 'plumbing',
    name: 'ডেমো প্রদানকারী D',
    area: 'ডেমো এলাকা ৪',
    specialties: ['টয়লেট মেরামত', 'ড্রেন পরিষ্কার', 'সিঙ্ক'],
    keywords: ['টয়লেট', 'toilet', 'ড্রেন', 'drain', 'সিঙ্ক', 'sink', 'প্লাম্বিং', 'plumbing', 'শাওয়ার', 'shower'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-i1',
    category: 'internet',
    name: 'ডেমো প্রদানকারী E',
    area: 'ডেমো এলাকা ৫',
    specialties: ['Wi-Fi সেটআপ', 'রাউটার কনফিগারেশন'],
    keywords: ['wi-fi', 'wifi', 'ওয়াইফাই', 'রাউটার', 'router', 'ইন্টারনেট', 'internet', 'কনেকশন', 'connection'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-i2',
    category: 'internet',
    name: 'ডেমো প্রদানকারী F',
    area: 'ডেমো এলাকা ৬',
    specialties: ['নেটওয়ার্ক সমস্যা', 'স্পিড ও সিগন্যাল'],
    keywords: ['নেটওয়ার্ক', 'network', 'ব্রডব্যান্ড', 'broadband', 'স্পিড', 'speed', 'সিগন্যাল', 'signal'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-c1',
    category: 'cleaning',
    name: 'ডেমো প্রদানকারী G',
    area: 'ডেমো এলাকা ৭',
    specialties: ['বাড়ি পরিষ্কার', 'মেঝে ও ঝাড়ু'],
    keywords: ['পরিচ্ছন্ন', 'cleaning', 'clean', 'ঝাড়ু', 'mop', 'মেঝে', 'floor', 'ধুলো', 'dust'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-c2',
    category: 'cleaning',
    name: 'ডেমো প্রদানকারী H',
    area: 'ডেমো এলাকা ৮',
    specialties: ['গভীর পরিচ্ছন্নতা', 'রান্নাঘর ও বাথরুম'],
    keywords: ['ক্লিনিং', 'সাফ', 'সফ', 'বাড়ি পরিষ্কার', 'bathroom', 'বাথরুম'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-t1',
    category: 'painting',
    name: 'ডেমো প্রদানকারী I',
    area: 'ডেমো এলাকা ৯',
    specialties: ['দেওয়াল পেইন্ট', 'রঙ ও পেইন্ট'],
    keywords: ['পেইন্ট', 'paint', 'রঙ', 'color', 'colour', 'দেওয়াল', 'wall', 'পেইন্টার', 'painter'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-t2',
    category: 'painting',
    name: 'ডেমো প্রদানকারী J',
    area: 'ডেমো এলাকা ১০',
    specialties: ['প্লাস্টার', 'নতুন পেইন্ট'],
    keywords: ['প্লাস্টার', 'plaster', 'দেওয়াল', 'wall', 'পেইন্ট', 'paint'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-v1',
    category: 'pest_control',
    name: 'ডেমো প্রদানকারী K',
    area: 'ডেমো এলাকা ১১',
    specialties: ['মশা ও পোকা', 'ককরোচ নিয়ন্ত্রণ'],
    keywords: ['পোকা', 'মশা', 'mosquito', 'ককরোচ', 'cockroach', 'pest', 'bug'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-v2',
    category: 'pest_control',
    name: 'ডেমো প্রদানকারী L',
    area: 'ডেমো এলাকা ১২',
    specialties: ['মাকড়সা', 'সাধারণ কীটনাশক'],
    keywords: ['মাকড়সা', 'কীট', 'pest', 'insect', 'ইঁদুর', 'rodent'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-w1',
    category: 'carpentry',
    name: 'ডেমো প্রদানকারী M',
    area: 'ডেমো এলাকা ১৩',
    specialties: ['দরজা মেরামত', 'জানালার কাজ'],
    keywords: ['দরজা', 'door', 'জানালা', 'window', 'কাঠ', 'wood', 'carpenter'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
  {
    id: 'demo-w2',
    category: 'carpentry',
    name: 'ডেমো প্রদানকারী N',
    area: 'ডেমো এলাকা ১৪',
    specialties: ['ফার্নিচার', 'তাক ও টেবিল'],
    keywords: ['ফার্নিচার', 'furniture', 'তাক', 'shelf', 'টেবিল', 'table', 'চেয়ার', 'chair'],
    note: 'শুধুমাত্র ডেমো — যোগাযোগের তথ্য নেই',
  },
];

module.exports = { providers, categoryLabels, categoryOrder };
