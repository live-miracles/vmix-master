' Script name: AutoGain
'
' It monitors the input which has AutoGain in the name or has type Audio or VideoCall
' and automatically adjusts the gain to prevent clipping or low volume.
' It keeps the top peaks of the voice in a range: a peak above the top of the range
' lowers the gain, and no peak reaching the bottom of the range for a while raises it.
' A clip lowers the gain too. You can configure the range and the thresholds below.
'
' Decibels = 20 * Math.Log10(Amplitude)

Dim SCRIPT_NAME As String = "auto-gain"
Dim SCRIPT_VERSION As String = "1.4.0"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AutoGain " & SCRIPT_VERSION)

' ===== Configurations =====
Dim LOOP_TIME As Integer = 50           ' Wait time between each loop iteration in ms

Dim CLIP_THRESHOLD_DB As Double = -1    ' meterF1 level in dB to consider as clipping
Dim CLIP_DOWN_TIME As Integer = 1000    ' Minimum time between gain decreases caused by clipping

Dim PEAK_HIGH_DB As Double = -5         ' Top of the peak range in dB; a peak above it lowers the gain
Dim PEAK_LOW_DB As Double = -6          ' Bottom of the peak range in dB; peaks must reach it or the gain is raised
Dim PEAK_WAIT As Integer = 5000         ' Time to wait after last peak above PEAK_LOW_DB before allowing gain increase
Dim GAIN_CHANGE_TIME As Integer = 3000  ' Minimum time after any gain change before the peak range raises or lowers it

Dim VOICE_THRESHOLD_DB As Double = -20  ' meterF1 level in dB to consider as voice present (-20 dB is 0.1 amplitude)
Dim VOICE_DURATION As Integer = 250     ' Time of continuous voice detection to consider as speaking
Dim VOICE_WAIT As Integer = 5000        ' If there is no voice for this time, script stops adjusting gain

' --- VERSION CHECK ---
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
                Console.WriteLine(timestamp & " AutoGain | Update available: v" & latestVersion & " (running v" & SCRIPT_VERSION & ") - https://github.com/live-miracles/vmix-master")
            End If
        End If
    End If
Catch ex As Exception
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " AutoGain | Could not check for updates: " & ex.Message)
End Try

' meterF1 is an amplitude: amplitude = 10 ^ (dB / 20)
Dim CLIP_THRESHOLD As Double = Math.Pow(10, CLIP_THRESHOLD_DB / 20)
Dim PEAK_HIGH As Double = Math.Pow(10, PEAK_HIGH_DB / 20)
Dim PEAK_LOW As Double = Math.Pow(10, PEAK_LOW_DB / 20)
Dim VOICE_THRESHOLD As Double = Math.Pow(10, VOICE_THRESHOLD_DB / 20)

' ====== Timestamps ======
Dim now As Double = 0
Dim peakTimestamp As Double = 0         ' When input last reached PEAK_LOW
Dim highPeakTimestamp As Double = 0     ' When input last went above PEAK_HIGH
Dim voiceThresholdTimestamp As Double = 0  ' When input made sound above VOICE_THRESHOLD
Dim voiceTimestamp As Double = 0        ' When input continuously spoke above VOICE_THRESHOLD for VOICE_DURATION
Dim clipDownTimestamp As Double = 0     ' When gain was last decreased because of clipping
Dim gainChangeTimestamp As Double = 0   ' When gain was last changed for any reason

Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(LOOP_TIME)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())
        now = (DateTime.Now - New DateTime(2000, 1, 1)).TotalMilliseconds

        ' Get AutoGain mic input node
        Dim micNode = xml.SelectSingleNode("//input[contains(@title, 'AutoGain')]")

        If micNode Is Nothing Then
            micNode = xml.SelectSingleNode("//input[@type='Audio']")
        End If

        If micNode Is Nothing Then
            micNode = xml.SelectSingleNode("//input[@type='VideoCall']")
        End If

        If micNode Is Nothing Then
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " AutoGain | No input found. Looked for an input with 'AutoGain' in its title, then an input of type Audio, then an input of type VideoCall. Trying again in 5 seconds.")
            Sleep(5000)
            Continue Do
        End If

        If micNode.Attributes("muted").Value = "True" Then
            ' Skip if muted
            voiceThresholdTimestamp = 0
            Continue Do
        End If

        Dim meterF1 As Double = CDbl(micNode.Attributes("meterF1").Value)
        Dim inputNumber As String = micNode.Attributes("number").Value
        Dim gainDb As Integer = CInt(micNode.Attributes("gainDb").Value)

        If meterF1 > PEAK_LOW Then
            peakTimestamp = now
        End If

        If meterF1 > PEAK_HIGH Then
            highPeakTimestamp = now
        End If

        ' Detect voice only when it is present for a duration
        ' to avoid false positives from short noises
        If meterF1 > VOICE_THRESHOLD Then
            If voiceThresholdTimestamp = 0 Then
                voiceThresholdTimestamp = now
            ElseIf now - voiceThresholdTimestamp > VOICE_DURATION Then
                voiceTimestamp = now
            End If
        Else
            voiceThresholdTimestamp = 0
        End If

        If now - voiceTimestamp > VOICE_WAIT Then
            ' No voice detected for a while, skip gain adjustments
            Continue Do
        End If

        Dim gainChange As Integer = 0
        If meterF1 > CLIP_THRESHOLD And now - clipDownTimestamp > CLIP_DOWN_TIME Then
            ' Decrease gain to prevent clipping
            gainChange = -1
            clipDownTimestamp = now
        ElseIf now - gainChangeTimestamp > GAIN_CHANGE_TIME Then
            If highPeakTimestamp > gainChangeTimestamp Then
                ' Decrease gain, a peak went above the range since the last gain change
                gainChange = -1
            ElseIf now - peakTimestamp > PEAK_WAIT Then
                ' Increase gain, no peak reached the range for PEAK_WAIT
                gainChange = 1
            End If
        End If

        If gainChange <> 0 Then
            gainChangeTimestamp = now
            Dim newGainDb As Integer = Math.Max(Math.Min(gainDb + gainChange, 24), 0)
            If newGainDb <> gainDb Then
                API.Function("SetGain", Input:=inputNumber, Value:=CStr(newGainDb))
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " AutoGain | Gain " & gainDb & " -> " & newGainDb & " dB")
            End If
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AutoGain | Unexpected error: " & ex.Message)
    End Try
Loop
