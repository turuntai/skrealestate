import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { cx, useToast } from '../components/ui';
import { applyMeta } from '../lib/seo';
import { whatsappHref } from '../lib/share';
import { CITIES } from '../lib/taxonomy';

const OFFICE_PHONE = '9851410559';

export function Contact() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    applyMeta({
      title: 'Contact us',
      description: 'Tell SK Real Estate what you are looking for in Kathmandu Valley and we will send matching properties as they come in.',
    });
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (name.trim().length < 2) err.name = 'Please enter your name';
    if (!/^9\d{9}$/.test(phone.replace(/\D/g, ''))) err.phone = 'Enter a 10-digit mobile starting with 9';
    if (message.trim().length < 10) err.message = 'Tell us a little more so we can actually help';
    setErrors(err);
    if (Object.keys(err).length) { toast('Please fix the highlighted fields', 'err'); return; }

    const body = [
      `Namaste! I'm ${name.trim()}.`,
      area && `Looking in: ${area}`,
      budget && `Budget: Rs ${budget}`,
      '',
      message.trim(),
      '',
      `Reach me on ${phone.trim()}`,
    ].filter(Boolean).join('\n');

    window.open(whatsappHref(OFFICE_PHONE, body), '_blank', 'noopener');
    setSent(true);
    toast('Opening WhatsApp with your message ready to send', 'ok');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid lg:grid-cols-[1fr_22rem] gap-10">
        {/* ---- form -------------------------------------------------- */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Tell us what you need</h1>
          <p className="text-brick-800 mt-3 text-[16px] leading-relaxed max-w-xl">
            Give us the area and the budget and we will message you when something fits —
            usually before it goes on the site. No charge to you, ever.
          </p>

          {sent ? (
            <div className="card p-8 mt-8 text-center">
              <span className="w-14 h-14 rounded-2xl bg-jade-50 text-jade-700 grid place-items-center mx-auto mb-4">
                <Icon name="check-circle" className="w-7 h-7" />
              </span>
              <h2 className="text-xl font-bold mb-2">Your message is ready in WhatsApp</h2>
              <p className="text-brick-700 text-[15px] max-w-sm mx-auto">
                Hit send there and we will reply the same working day. If WhatsApp did not
                open, call us on {OFFICE_PHONE}.
              </p>
              <button onClick={() => setSent(false)} className="btn-outline mt-6">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="card p-5 sm:p-7 mt-8 space-y-5" noValidate>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label" htmlFor="c-name">Your name <span className="text-crimson-600">*</span></label>
                  <input
                    id="c-name" value={name} onChange={(e) => setName(e.target.value)}
                    className={cx('field', errors.name && 'field-err')} placeholder="Suman Thapa" autoComplete="name"
                  />
                  {errors.name && <p className="err"><Icon name="alert" className="w-3.5 h-3.5 mt-px" />{errors.name}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="c-phone">Mobile <span className="text-crimson-600">*</span></label>
                  <input
                    id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric"
                    className={cx('field', errors.phone && 'field-err')} placeholder="98XXXXXXXX" autoComplete="tel"
                  />
                  {errors.phone && <p className="err"><Icon name="alert" className="w-3.5 h-3.5 mt-px" />{errors.phone}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label" htmlFor="c-area">Which area</label>
                  <select id="c-area" value={area} onChange={(e) => setArea(e.target.value)} className="field">
                    <option value="">Anywhere in the valley</option>
                    {CITIES.map((c) => (
                      <optgroup key={c.name} label={c.name}>
                        {c.areas.map((a) => <option key={a}>{a}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="c-budget">Monthly budget (NPR)</label>
                  <input
                    id="c-budget" value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="numeric"
                    className="field" placeholder="25000"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="c-msg">What are you looking for? <span className="text-crimson-600">*</span></label>
                <textarea
                  id="c-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={5}
                  className={cx('field resize-none', errors.message && 'field-err')}
                  placeholder="2BHK for a family of four, need car parking and a place near a school. Moving in by Mangsir."
                />
                {errors.message && <p className="err"><Icon name="alert" className="w-3.5 h-3.5 mt-px" />{errors.message}</p>}
              </div>

              <button type="submit" className="btn-jade btn-lg w-full">
                <Icon name="whatsapp" className="w-4.5 h-4.5" filled /> Send on WhatsApp
              </button>
              <p className="hint text-center">
                Your message opens in WhatsApp so it reaches us straight away. We never pass
                your number to anyone else.
              </p>
            </form>
          )}
        </div>

        {/* ---- office card ------------------------------------------ */}
        <aside className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4">Our office</h2>
            <ul className="space-y-4 text-[14.5px]">
              <li className="flex gap-3">
                <Icon name="pin" className="w-4.5 h-4.5 text-crimson-600 shrink-0 mt-0.5" />
                <span>Kupondole Height, Ward 10<br />Lalitpur, Bagmati Province</span>
              </li>
              <li className="flex gap-3">
                <Icon name="phone" className="w-4.5 h-4.5 text-crimson-600 shrink-0 mt-0.5" />
                <a href={`tel:+977${OFFICE_PHONE}`} className="hover:text-crimson-700 font-medium">{OFFICE_PHONE}</a>
              </li>
              <li className="flex gap-3">
                <Icon name="mail" className="w-4.5 h-4.5 text-crimson-600 shrink-0 mt-0.5" />
                <a href="mailto:info@skrealestate.com.np" className="hover:text-crimson-700 break-all">info@skrealestate.com.np</a>
              </li>
              <li className="flex gap-3">
                <Icon name="clock" className="w-4.5 h-4.5 text-crimson-600 shrink-0 mt-0.5" />
                <span>Sunday – Friday<br />10:00 AM – 6:00 PM</span>
              </li>
            </ul>
            <div className="grid grid-cols-2 gap-2.5 mt-6">
              <a href={`tel:+977${OFFICE_PHONE}`} className="btn-navy btn-sm">
                <Icon name="phone" className="w-4 h-4" strokeWidth={2.2} /> Call
              </a>
              <a
                href={whatsappHref(OFFICE_PHONE, 'Namaste! I have a question about a property.')}
                target="_blank" rel="noreferrer noopener" className="btn-jade btn-sm"
              >
                <Icon name="whatsapp" className="w-4 h-4" filled /> WhatsApp
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-marigold-200 bg-marigold-50 p-5">
            <div className="flex items-center gap-2 font-bold text-marigold-900 mb-2">
              <Icon name="info" className="w-5 h-5" /> Have a property to list?
            </div>
            <p className="text-[14px] text-marigold-900/85 leading-relaxed">
              Call us and we will come to the property, photograph it and write the listing
              for you. Usually done the same week.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
