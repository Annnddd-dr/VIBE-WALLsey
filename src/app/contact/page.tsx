import { Mail, MessageCircle, Clock, PackageSearch } from 'lucide-react';

export const metadata = { title: 'Contact · VIBEWALLseyy' };

export default function ContactPage() {
  return (
    <div className="container-page py-12 lg:py-20 max-w-3xl">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="eyebrow">Contact</p>
        <h1 className="text-3xl lg:text-4xl mt-2">We reply like it matters. Because it does.</h1>
        <p className="text-ink-secondary text-sm mt-3 max-w-md mx-auto">
          Order questions, print advice, bulk orders — write to us and a human will get back to you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="mailto:support@vibewallsey.com" className="glass-card rounded-sm p-6 block hover:border-accent transition-colors">
          <Mail size={18} className="text-accent" />
          <p className="text-xs uppercase tracking-wider text-ink/50 mt-3">Email us</p>
          <p className="text-sm font-medium mt-1">support@vibewallsey.com</p>
        </a>
        <div className="glass-card rounded-sm p-6">
          <MessageCircle size={18} className="text-accent" />
          <p className="text-xs uppercase tracking-wider text-ink/50 mt-3">WhatsApp</p>
          <p className="text-sm font-medium mt-1">+91 98765 00000</p>
        </div>
        <div className="glass-card rounded-sm p-6">
          <Clock size={18} className="text-accent" />
          <p className="text-xs uppercase tracking-wider text-ink/50 mt-3">Response time</p>
          <p className="text-sm font-medium mt-1">Within 24 hours, Mon–Sat</p>
        </div>
        <a href="/track-order" className="glass-card rounded-sm p-6 block hover:border-accent transition-colors">
          <PackageSearch size={18} className="text-accent" />
          <p className="text-xs uppercase tracking-wider text-ink/50 mt-3">Order status</p>
          <p className="text-sm font-medium mt-1">Track your order instantly →</p>
        </a>
      </div>

      <div className="mt-12 glass-card rounded-sm p-6 sm:p-8">
        <h2 className="font-display text-xl">Studio address</h2>
        <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
          VIBEWALLseyy (POSTERraxx)
          <br />
          Print Studio, Bangalore, Karnataka, India
          <br />
          Prints dispatch in 24–48 h · Delivered in 4–7 days across India
        </p>
      </div>
    </div>
  );
}
