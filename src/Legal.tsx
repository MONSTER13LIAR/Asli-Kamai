import type { ReactNode } from 'react'
import { ThemeSwitch, useTheme } from './theme'

// Privacy Policy and Terms of Service. Written in plain words for riders,
// with a short Hindi summary on top. Keep both in step with what the code
// actually does: if a feature starts sending or storing something new, this
// page changes in the same commit.

const EMAIL = 'monster13liar@gmail.com'
const EFFECTIVE = '10 October 2026'

const Mail = () => <a href={`mailto:${EMAIL}`}>{EMAIL}</a>

function Shell({ title, summary, children }: { title: string; summary: string[]; children: ReactNode }) {
  const { theme, toggle } = useTheme()
  return (
    <div className="site legal">
      <header className="nav">
        <a className="brand" href="/">Asli Kamai</a>
        <nav>
          <a href="/">Home</a>
          <a className="btn small" href="/app/">Open the app</a>
          <ThemeSwitch theme={theme} toggle={toggle} />
        </nav>
      </header>

      <section className="legal-hero">
        <p className="eyebrow">Effective {EFFECTIVE}</p>
        <h1>{title}</h1>
      </section>

      <section className="card legal-summary" lang="hi">
        <h2>हिंदी में सार</h2>
        <ul>
          {summary.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <p className="muted">पूरी बात नीचे अंग्रेज़ी में है। कोई सवाल हो तो ईमेल करें: <Mail /></p>
      </section>

      <article className="legal-body">{children}</article>

      <footer className="site-foot">
        <span className="brand">Asli Kamai</span>
        <nav>
          <a href="/">Home</a>
          <a href="/app/">Open the app</a>
          <a href="/privacy/">Privacy</a>
          <a href="/terms/">Terms</a>
          <a href="/developer/">Developer</a>
        </nav>
        <span className="muted">Built for riders in India.</span>
      </footer>
    </div>
  )
}

export function Privacy() {
  return (
    <Shell
      title="Privacy Policy"
      summary={[
        'Asli Kamai मुफ़्त है। आपकी शिफ्ट, कमाई और खर्च पहले सिर्फ़ आपके फ़ोन पर सेव होते हैं।',
        'Google से साइन इन करने पर आपका नाम, ईमेल, प्रोफ़ाइल फ़ोटो और आपका पूरा हिसाब हमारे डेटाबेस में सेव होता है, ताकि नए फ़ोन पर भी मिल जाए।',
        'हफ्ते की समझ, कोच, क्विज़, और बोलकर या फ़ोटो से शिफ्ट जोड़ने के लिए आपके आंकड़े, आपके लिखे शब्द या फ़ोटो एक AI मॉडल (Featherless पर Qwen3) को भेजे जाते हैं। आपका नाम और ईमेल नहीं भेजे जाते।',
        'हम आपका डेटा बेचते नहीं हैं, और उससे AI मॉडल ट्रेन नहीं करते।',
        'अपना खाता और हिसाब हटवाने के लिए हमें ईमेल करें।',
      ]}
    >
      <p className="legal-lead">
        This page explains what Asli Kamai collects, where it goes, and what you can do about it. It describes what the
        app actually does today. If something here is unclear, email <Mail />.
      </p>

      <h2>Who runs Asli Kamai</h2>
      <p>
        Asli Kamai is built and run by Abhijay Gupta, an individual in India. In this policy, "we" and "us" mean him.
        You can reach him at <Mail />.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>You can use the app without an account. Then your record stays in your browser on your phone.</li>
        <li>If you sign in with Google, your record is also saved on our server so it survives a new phone.</li>
        <li>Some features send your numbers, your words or a photo to an AI model to get an answer. Your name and email are never sent to it.</li>
        <li>We do not sell your data. We do not show ads. We do not use your data to train AI models.</li>
        <li>We never log in to Swiggy, Zomato, Rapido, Porter, Uber or any other platform for you, and we share nothing with them.</li>
      </ul>

      <h2>What is saved on your phone</h2>
      <p>The app saves these in your browser's storage on your device:</p>
      <ul>
        <li>Your shifts: date, app, time of day, hours, earnings and petrol, and whether you typed, spoke or photographed it.</li>
        <li>Your monthly costs: bike EMI, recharge, upkeep and working days.</li>
        <li>Your savings goal, if you set one: its name, amount, date and how much you have saved.</li>
        <li>Which lessons you have seen and your quiz scores.</li>
        <li>Your language and light or dark choice, and a sign-in token if you signed in.</li>
      </ul>
      <p>
        Your chat with the coach and the weekly explanation are kept only until you close the tab. "Clear everything" in
        the app removes your shifts and costs from the phone. Clearing your browser's data removes all of it.
      </p>
      <p>The app itself does not set cookies.</p>

      <h2>When you sign in with Google</h2>
      <p>
        After you have logged 10 of your own shifts, the app asks you to sign in with Google. When you sign in, Google
        tells us your Google account ID, email address, name and the link to your profile picture. We save these, the
        time your account was made and the last time you signed in. We never see your Google password or anything else
        in your Google account.
      </p>
      <p>
        While you are signed in, your whole record (everything in the list above except language, theme and the token)
        is copied to our database each time it changes. The database is Postgres run by Neon, on servers in the United
        States. Your phone keeps a sign-in token that lasts 90 days.
      </p>

      <h2>What the AI model sees</h2>
      <p>
        Asli Kamai uses Qwen3 models run by Featherless AI to put your numbers into words and to read notes and photos.
        Every rupee figure is worked out by the app's own code first. These features send data to the model, whether or
        not you are signed in:
      </p>
      <ul>
        <li>
          <b>Weekly explanation, coach and quiz.</b> Your phone sends your record to our server. The server works out
          totals from it, such as earnings and petrol by app and time of day, earnings per hour, your costs per working
          day, and your goal's name and amount, and sends those totals to the model. The weekly explanation runs on its own
          when the week on screen has shifts.
        </li>
        <li>
          <b>Coach questions.</b> The coach also sends your last few messages, exactly as you typed them. Please do not
          type phone numbers, bank details or other private things into the coach.
        </li>
        <li>
          <b>"Say it" and typed notes.</b> When you tap "Read it", the text of your note is sent to the model so it can
          fill the shift form.
        </li>
        <li>
          <b>Photos of earnings screens.</b> The photo is made smaller on your phone, then sent through our server to the
          model so it can read the numbers. We do not save the photo. Only the numbers you check and save are kept.
        </li>
      </ul>
      <p>
        Your name and email are never sent to the model. We send data to Featherless only to get the answer back, and
        our server does not keep a copy of what was sent or of the model's reply. Featherless's own privacy policy covers
        how it handles these requests.
      </p>

      <h2>Voice input</h2>
      <p>
        The microphone button uses your browser's own speech recognition. We never receive your voice recording, only the
        text that appears in the box. In Google Chrome and on most Android phones, the browser turns speech into text
        using Google's speech service, so your voice is handled by Google under Google's terms. If you would rather not,
        type the note instead.
      </p>

      <h2>Other services we use</h2>
      <ul>
        <li><b>Vercel</b> hosts the site, the app and our server code. Like any web host, it sees your IP address and basic browser details when you open a page.</li>
        <li><b>Vercel Web Analytics</b> runs on the home page only. It counts visits and records the page, where the visit came from, browser, device type and country. Vercel states that it does not use cookies.</li>
        <li><b>Neon</b> stores the database for signed-in users.</li>
        <li><b>Featherless AI</b> runs the Qwen3 models described above.</li>
        <li><b>Google</b> provides sign-in and the fonts on our pages. Loading them lets Google see your IP address. On Chrome and Android, Google may also handle voice input.</li>
      </ul>

      <h2>Short-lived technical data</h2>
      <p>
        To stop one person or script from overloading the AI features, our server remembers your IP address for up to 10
        minutes to count requests. It is held in memory only and is not saved to the database.
      </p>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell, rent or trade your data.</li>
        <li>We do not show ads or share your data with advertisers.</li>
        <li>We do not use your data to train AI models, and we do not give it to anyone else to train them.</li>
        <li>We do not share your data with delivery or ride platforms, lenders or employers.</li>
        <li>We will only hand over data if Indian law requires it, for example a valid order from an authority.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li><b>Use it without an account.</b> Until the sign-in step, nothing about you is saved on our server.</li>
        <li><b>Clear everything.</b> Removes your shifts and costs from the phone. If you are signed in, the empty record also replaces the copy on our server. Your account (name and email) stays until you ask us to delete it.</li>
        <li><b>Sign out.</b> Tap your picture in the app. Your shifts stay on the phone.</li>
        <li><b>Delete your account.</b> Email <Mail /> from the Google email you signed in with. We will delete your account and your record from our database.</li>
        <li><b>Get a copy or fix something.</b> Email us and we will send you what we hold or correct it.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Data on your phone stays until you clear it. Data on our server stays while your account exists, until you clear
        it or ask us to delete it.
      </p>

      <h2>Keeping it safe</h2>
      <p>
        Every connection uses HTTPS. Sign-in tokens are signed by our server, and the database connection is encrypted
        and protected by a password. No system is perfect, so keep your phone locked and sign out on shared phones.
      </p>

      <h2>Age</h2>
      <p>
        You must be at least 13 years old to use Asli Kamai. If you think someone under 13 has signed in, email us and we
        will delete their account.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If the app starts collecting or sending something new, we will update this page and the date at the top before or
        at the same time as the change.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, requests or complaints about your data: <Mail />. Also see the <a href="/terms/">Terms of Service</a>.
      </p>
    </Shell>
  )
}

export function Terms() {
  return (
    <Shell
      title="Terms of Service"
      summary={[
        'Asli Kamai मुफ़्त है। यह आपकी कमाई का निजी हिसाब और कोच है।',
        'यह वित्तीय सलाह नहीं है। सारे आंकड़े अनुमान हैं, जो आपके डाले गए नंबरों पर आधारित हैं।',
        'AI गलती कर सकता है। सेव करने से पहले हर नंबर खुद जाँचें।',
        'हम Swiggy, Zomato, Rapido, Porter या Uber से जुड़े नहीं हैं।',
        'इस्तेमाल के लिए आपकी उम्र कम से कम 13 साल होनी चाहिए। भारत का कानून लागू होता है।',
      ]}
    >
      <p className="legal-lead">
        These are the rules for using Asli Kamai, in plain words. By using the site or the app you agree to them. If you
        do not agree, please do not use Asli Kamai.
      </p>

      <h2>Who runs Asli Kamai</h2>
      <p>
        Asli Kamai is built and run by Abhijay Gupta, an individual in India. In these terms, "we" and "us" mean him. You
        can reach him at <Mail />.
      </p>

      <h2>What Asli Kamai is</h2>
      <p>
        Asli Kamai is a free personal tracker and coach for delivery and ride workers. You log your shifts and costs, and
        the app shows what you kept, explains where the rest went, and teaches money ideas using your own numbers. There
        is no charge to use it.
      </p>

      <h2>Not financial advice</h2>
      <p>
        Asli Kamai is not a bank, a financial adviser, a chartered accountant or a tax adviser. The explanations, coach
        answers, lessons and quizzes are general learning based on your own record. They are not advice about loans,
        EMIs, savings, investments or taxes. Before a big money decision, talk to a qualified person you trust.
      </p>

      <h2>All numbers are estimates</h2>
      <p>Every figure in the app is an estimate. It is only as good as what you enter, and:</p>
      <ul>
        <li>Monthly costs are spread evenly over the working days you set, which will not match every real day.</li>
        <li>The app does not know about platform cuts, incentives, penalties, tips, taxes or costs you did not enter.</li>
        <li>Savings goals and deposit figures are rough guides, not promises of what you will have.</li>
      </ul>

      <h2>The AI can be wrong</h2>
      <p>
        Some features use an AI model to read your voice notes, typed notes and photos, and to put your numbers into
        words. It can misread a number, a date or an app name, or misunderstand a question. That is why the app shows you
        every field before saving. Check each one. You are responsible for the numbers you save.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 13 years old to use Asli Kamai.</li>
        <li>Sign-in is through your Google account. Keep your phone and Google account secure.</li>
        <li>An account is for one person and their own record.</li>
      </ul>

      <h2>Your data</h2>
      <p>
        Your record belongs to you. You let us store it and process it only to run the app for you, as explained in the{' '}
        <a href="/privacy/">Privacy Policy</a>. We do not sell it and we do not use it to train AI models.
      </p>

      <h2>Fair use</h2>
      <p>Please do not:</p>
      <ul>
        <li>use scripts or bots to send requests, or try to overload the app or its AI features;</li>
        <li>try to break into the app, the server, the database or someone else's account;</li>
        <li>upload anything illegal, or other people's private information.</li>
      </ul>
      <p>The app limits how many AI requests can be made in a short time, so everyone gets a fair share.</p>

      <h2>Not connected to any platform</h2>
      <p>
        Asli Kamai is independent. It is not made, approved or supported by Swiggy, Zomato, Rapido, Porter, Uber or any
        other platform. Their names belong to their owners and are used only so you can label your own shifts.
      </p>

      <h2>Changes and availability</h2>
      <p>
        Asli Kamai is run by one person and is offered as it is. We may change, pause or stop it at any time. We try to
        keep it working and your data safe, but we cannot promise it will always be available or free of mistakes. If your
        record matters to you, sign in so it is backed up, and keep your own notes too.
      </p>

      <h2>Limits on our responsibility</h2>
      <p>
        As far as Indian law allows, we are not responsible for any loss that comes from relying on the app's figures,
        explanations or coach answers, from a mistake in reading a note or photo, or from lost data. Nothing in these terms
        takes away rights that you have by law and that cannot be taken away.
      </p>

      <h2>Stopping</h2>
      <p>
        You can stop using Asli Kamai at any time, and ask us to delete your account by emailing <Mail />. We may block
        access for anyone who misuses the app or breaks these terms.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        If we change these terms, we will update this page and the date at the top. If you keep using Asli Kamai after
        that, the new terms apply.
      </p>

      <h2>Law</h2>
      <p>These terms are governed by the laws of India, and any dispute will be handled by the courts in India.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <Mail />.
      </p>
    </Shell>
  )
}
