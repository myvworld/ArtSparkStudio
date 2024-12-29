
export default function Copyright() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-8 text-4xl font-bold">Copyright Notice</h1>
      <div className="prose prose-invert">
        <p>© {new Date().getFullYear()} Vworld New Media. All rights reserved.</p>
        
        <h2>Copyright Protection</h2>
        <p>All content included on this site, such as text, graphics, logos, button icons, images, audio clips, digital downloads, data compilations, and software, is the property of Vworld New Media or its content suppliers and protected by international copyright laws.</p>
        
        <h2>Use of Content</h2>
        <p>The content on this website is provided for your personal, non-commercial use only. You may not modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information, software, products or services obtained from this website without prior written permission from Vworld New Media.</p>
      </div>
    </div>
  );
}
