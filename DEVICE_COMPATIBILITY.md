# Device Compatibility Guide

## ✅ Supported Devices

MirrorMyTV works on **all devices** that can access the web interface via IP address.

---

## 📱 Device Support Matrix

| Device Type | Browser | Status | Notes |
|-------------|---------|--------|-------|
| **Android TV** | Chrome/Firefox | ✅ **Works Great** | Full HLS support via Hls.js |
| **Android TV** | Default Browser | ✅ **Works** | May need Chrome |
| **Android Phone** | Chrome | ✅ **Excellent** | Best Android experience |
| **Android Phone** | Firefox | ✅ **Good** | Full HLS support |
| **Android Phone** | Samsung Internet | ✅ **Good** | Full HLS support |
| **Android Tablet** | Chrome | ✅ **Excellent** | Large screen optimized |
| **Android Tablet** | Firefox | ✅ **Good** | Full HLS support |
| **iOS iPhone** | Safari | ✅ **Best** | Native HLS support |
| **iOS iPhone** | Chrome | ⚠️ **Limited** | Use Safari instead |
| **iOS iPad** | Safari | ✅ **Best** | Native HLS support |
| **iOS iPad** | Chrome | ⚠️ **Limited** | Use Safari instead |
| **Windows PC** | Chrome/Edge | ✅ **Excellent** | Full support |
| **Windows PC** | Firefox | ✅ **Excellent** | Full support |
| **Mac** | Safari | ✅ **Excellent** | Native HLS |
| **Mac** | Chrome | ✅ **Excellent** | Full support |

---

## 🎯 How to Access from Any Device

### Step 1: Find Your PC's IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address

### Step 2: Access from Any Device

Open browser on your device and go to:
```
http://YOUR_PC_IP:3000
```

**Example:**
```
http://192.168.1.100:3000
```

---

## 📺 Android TV Setup

### Option 1: Using Android TV Browser

1. **Open browser on Android TV** (Chrome or Firefox)
2. **Navigate to:** `http://YOUR_PC_IP:3000`
3. **Select window** from your PC
4. **Click "Start Streaming"**
5. **Wait 5-10 seconds** for video to load
6. **Enjoy!** 🎉

### Option 2: Using Android TV Remote Control

If you have a remote with a keyboard:
- Use the remote to navigate
- Press OK/Select to click buttons
- Use directional pad to scroll

### Option 3: Using Phone as Remote

1. **Open browser on your phone**
2. **Go to:** `http://YOUR_PC_IP:3000`
3. **Select window and start stream**
4. **Stream will appear on TV** (if on same network)

---

## 📱 Android Phone/Tablet Setup

### Chrome (Recommended)

1. **Open Chrome browser**
2. **Go to:** `http://YOUR_PC_IP:3000`
3. **Allow camera/microphone if prompted**
4. **Select window and start stream**
5. **Video plays automatically!**

### Firefox

1. **Open Firefox browser**
2. **Go to:** `http://YOUR_PC_IP:3000`
3. **Select window and start stream**
4. **Works great!**

---

## 🍎 iOS iPhone/iPad Setup

### Safari (Recommended)

1. **Open Safari browser**
2. **Go to:** `http://YOUR_PC_IP:3000`
3. **Select window and start stream**
4. **Best experience on iOS!**

### Chrome (Limited)

- Works but Safari is better
- May have some limitations

---

## 🔧 Troubleshooting by Device

### Android TV Issues

**Problem:** Black screen
**Solution:**
1. Wait 10-15 seconds after starting stream
2. Check browser console (if available)
3. Try Chrome instead of default browser
4. Make sure you're on same WiFi network

**Problem:** Can't click buttons
**Solution:**
1. Use remote control directional pad
2. Use phone as remote (see Option 3 above)
3. Connect wireless mouse/keyboard to TV

**Problem:** Video doesn't load
**Solution:**
1. Check server logs on PC
2. Verify FFmpeg is running
3. Try refreshing the page
4. Check network connection

### Android Phone/Tablet Issues

**Problem:** Blank screen
**Solution:**
1. Wait 5-10 seconds
2. Check browser console (Chrome DevTools)
3. Try Chrome browser
4. Check if HLS is supported

**Problem:** Video won't play
**Solution:**
1. Check if you're on same network
2. Verify server is running on PC
3. Try refreshing the page
4. Check browser console for errors

### iOS iPhone/iPad Issues

**Problem:** Video won't play
**Solution:**
1. Use Safari (not Chrome)
2. Check if you're on same network
3. Try refreshing the page
4. Check server logs

**Problem:** Black screen
**Solution:**
1. Wait 10 seconds after starting
2. Check if native HLS is detected
3. Try Safari browser
4. Check network connection

---

## 🌐 Network Requirements

### Same Network Required

All devices must be on the **same WiFi network** as your PC.

**Check:**
- PC WiFi: `192.168.1.100`
- Phone WiFi: `192.168.1.101` ✅ Same network!
- Phone WiFi: `10.0.0.50` ❌ Different network!

### Firewall Settings

Make sure Windows Firewall allows port 3000:
```cmd
netsh advfirewall firewall add rule name="MirrorMyTV" dir=in action=allow protocol=TCP localport=3000
```

---

## 📊 Performance by Device

| Device Type | Video Quality | Latency | Stability |
|-------------|---------------|---------|-----------|
| Android TV | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Android Phone | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Android Tablet | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| iOS iPhone | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| iOS iPad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Windows PC | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎮 Recommended Browsers

### Best Performance

1. **Chrome** - Best overall (all devices)
2. **Safari** - Best for iOS
3. **Firefox** - Good alternative
4. **Edge** - Good for Windows

### Avoid

- **Internet Explorer** - Not supported
- **Old browsers** - May not support HLS
- **Opera Mini** - Limited support

---

## 💡 Tips for Best Experience

### For Android TV

1. **Use Chrome browser** for best results
2. **Connect wired mouse/keyboard** for easier navigation
3. **Use phone as remote** for convenience
4. **Keep TV close to WiFi router** for best signal

### For Phones/Tablets

1. **Use Chrome or Safari** for best results
2. **Keep device close to WiFi router** for best signal
3. **Don't switch apps** while streaming
4. **Close other apps** to free up memory

### For All Devices

1. **Same WiFi network** is essential
2. **Good WiFi signal** for smooth streaming
3. **Don't use VPN** on client devices
4. **Restart server** if issues persist

---

## 🔍 Device Detection

The app automatically detects your device type:

**Console Output:**
```javascript
Device Info: {
  deviceType: "Android TV",  // or "Phone", "Tablet", "Desktop"
  isMobile: true,
  isAndroidTV: true,
  isTablet: false,
  isPhone: false,
  hlsSupported: true,
  nativeHLS: false
}
```

---

## 📝 Quick Reference

### Access URL Format
```
http://YOUR_PC_IP:3000
```

### Default Port
```
3000
```

### Supported Protocols
```
HTTP (not HTTPS)
```

### Required Network
```
Same WiFi network
```

---

## 🎉 Summary

**YES, it works on:**
- ✅ Android TV
- ✅ Android Phone
- ✅ Android Tablet
- ✅ iOS iPhone
- ✅ iOS iPad
- ✅ Windows PC
- ✅ Mac
- ✅ Linux

**Just open the browser and go to:**
```
http://YOUR_PC_IP:3000
```

**That's it!** 🚀

