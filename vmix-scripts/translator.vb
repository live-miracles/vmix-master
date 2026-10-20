' Script name: Translator
'
' This is a sidechain translator script, which monitors the mic/call input level
' and reduces the volume of the chain Bus when the translator is speaking.
' You can configure the fade times and threshold values below.
' Decibels = 20 * Math.Log10(Amplitude)
'
' Recommended setup:
'   - Source/program audio goes to CHAIN_BUS.
'   - Translator input goes to delayed Bus C only, with Master disabled.
'   - Add a 800 ms sound delay plugin on Bus C.
'   - Bus C audio goes to master.
'
' The script will automatically detect a mic or vMix Call, and you can also specify
' it manually by adding "Translator" keyword in the input title.
'
' Volumes are set in decibels (dB) relative to the full bus volume, so 0 is full volume
' and -6 is about half the amplitude. The script converts them to the vMix volume scale,
' which is not linear, see docs/3-reference/1-audio-levels.md.
'
' Source Volume (chain bus)
' | ──────●                                   ●─────
' |        \                                 /
' |         \                               /
' |          \                             /
' |           \                           /
' |            \                         /
' |             ●─────────●─────────────●
' +----+----+----+----+----+----+----+----+----+----→ Time
'          T1             T2           T3
' T1 - when translator started speaking, and we lowering the source volume.
' T2 - translator stopped speaking
' T3 - translator didn't speak for SILENCE_LIMIT and we start raising the source volume.

' ===== Configurations (all times in ms) =====
Dim LOOP_TIME As Integer = 50           ' Wait time between each loop iteration in ms
Dim VOICE_THRESHOLD_DB As Double = -20  ' meterF1 level in dB to consider as voice present (-20 dB is 0.1 amplitude)
Dim CHAIN_BUS As String = "B"           ' Script will be adjusting volume for this bus

' VOLUME_DOWN_TIME = 900 ms is good down time when using recommended setup with 800 ms delay for the translator,
' but if translator directly goes to master without delay better to use 350 ms
Dim VOLUME_DOWN_TIME As Integer = 900   ' How fast to fade volume down when translator starts speaking
Dim VOLUME_REDUCED_DB As Double = -24   ' Source volume in dB when translator is speaking (-24 dB is 50 on the vMix volume scale)

' The below configurations with VOLUME_FULL_DB = -6 are good for a translation scenario when
' the translator is almost always speaking. If there is music or other parts which should be in full use
' volume you can adjust the settings accordingly: VOLUME_FULL_DB = 0 (full volume if no translation for a while)
Dim SILENCE_LIMIT As Integer = 2000     ' If translator doesn't speak for this duration we will start raising volume
Dim VOLUME_UP_TIME As Integer = 5000    ' How fast to raise volume
Dim VOLUME_FULL_DB As Double = -6       ' Source volume in dB after raising (-6 dB is 84 on the vMix volume scale)

' --- VERSION CHECK ---
Dim SCRIPT_NAME As String = "translator"
Dim SCRIPT_VERSION As String = "1.3.1"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " Translator " & SCRIPT_VERSION)

Try
    Dim verRequest As System.Net.HttpWebRequest = System.Net.HttpWebRequest.Create(VERSIONS_URL)
    verRequest.Timeout = 5000
    Dim verResponse As System.Net.HttpWebResponse = verRequest.GetResponse()
    Dim verReader As New System.IO.StreamReader(verResponse.GetResponseStream())
    Dim verJson As String = verReader.ReadToEnd()
    verReader.Close()
    verResponse.Close()

    Dim key As String = """" & SCRIPT_NAME & """:"
    Dim keyIndex As Integer = verJson.IndexOf(key)
    If keyIndex >= 0 Then
        Dim valueStart As Integer = verJson.IndexOf("""", keyIndex + key.Length) + 1
        Dim valueEnd As Integer = verJson.IndexOf("""", valueStart)
        If valueStart > 0 And valueEnd > valueStart Then
            Dim latestVersion As String = verJson.Substring(valueStart, valueEnd - valueStart)
            If latestVersion <> SCRIPT_VERSION Then
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " Translator | Update available: v" & latestVersion & " (running v" & SCRIPT_VERSION & ") - https://github.com/live-miracles/vmix-master")
            End If
        End If
    End If
Catch ex As Exception
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " Translator | Could not check for updates: " & ex.Message)
End Try

' meterF1 is an amplitude: amplitude = 10 ^ (dB / 20)
Dim VOICE_THRESHOLD As Double = Math.Pow(10, VOICE_THRESHOLD_DB / 20)

' vMix volume scale = 100 * 10 ^ (dB / 80), it is the amplitude raised to the power of a quarter.
Dim VOLUME_REDUCED As Integer = CInt(Math.Round(Math.Min(100, 100 * Math.Pow(10, VOLUME_REDUCED_DB / 80))))
Dim VOLUME_FULL As Integer = CInt(Math.Round(Math.Min(100, 100 * Math.Pow(10, VOLUME_FULL_DB / 80))))

' ====== State ======
Dim now As Double = 0
Dim lastActiveTimestamp As Double = 0   ' When translator last reached VOICE_THRESHOLD
Dim fadeDownTimestamp As Double = 0     ' When we started fading down volume
Dim isRaised As Boolean = True          ' False after translator spoke, until we raise volume again.
                                        ' Guard against raising volume before translator has ever spoken

Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(LOOP_TIME)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())
        now = (DateTime.Now - New DateTime(2000, 1, 1)).TotalMilliseconds

        ' Get Translator mic input node
        Dim micNode = xml.SelectSingleNode("//input[contains(@title, 'Translator')]")

        If micNode Is Nothing Then
            micNode = xml.SelectSingleNode("//input[@type='Audio']")
        End If

        If micNode Is Nothing Then
            micNode = xml.SelectSingleNode("//input[@type='VideoCall']")
        End If

        If micNode Is Nothing Then
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " Translator | No input found. Looked for an input with 'Translator' in its title, then an input of type Audio, then an input of type VideoCall. Trying again in 5 seconds.")
            Sleep(5000)
            Continue Do
        End If

        Dim micLevel As Double = CDbl(micNode.Attributes("meterF1").Value)
        Dim micMuted As String = micNode.Attributes("muted").Value

        If micLevel > VOICE_THRESHOLD And micMuted = "False" Then
            ' --- Translator is speaking, reduce volume ---
            isRaised = False
            lastActiveTimestamp = now
            If now - fadeDownTimestamp > VOLUME_DOWN_TIME Then
                API.Function("SetBus" & CHAIN_BUS & "VolumeFade", Value:=(VOLUME_REDUCED & "," & VOLUME_DOWN_TIME))
                fadeDownTimestamp = now
            End If

        ElseIf Not isRaised And now - lastActiveTimestamp > SILENCE_LIMIT Then
            ' --- Translator is silent for a while, raise volume ---
            API.Function("SetBus" & CHAIN_BUS & "VolumeFade", Value:=(VOLUME_FULL & "," & VOLUME_UP_TIME))
            isRaised = True
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " Translator | Unexpected error: " & ex.Message)
    End Try
Loop
