' Script name: AutoGain
'
' It monitors the input which has AutoGain in the name or has type Audio or VideoCall
' and automatically adjusts the gain to prevent clipping or low volume.
' You can configure the clip and peak threshold values below.
'
' Decibels = 20 * Math.Log10(Amplitude)

Dim SCRIPT_NAME As String = "auto-gain"
Dim SCRIPT_VERSION As String = "1.2.0"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AutoGain " & SCRIPT_VERSION)

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

' ===== Configurations =====
Dim LOOP_TIME As Integer = 50           ' Wait time between each loop iteration in ms

Dim CLIP_THRESHOLD As Double = 0.9      ' 0.9 ~ -1dB; meterF1 value to consider as clipping
Dim GAIN_DOWN_TIME As Integer = 1000    ' Minimum time between gain decreases

Dim PEAK_THRESHOLD As Double = 0.45     ' 0.45 ~ -7dB; meterF1 value to consider as loud enough
Dim PEAK_WAIT As Integer = 5000         ' Time to wait after last peak detected before allowing gain increase
Dim GAIN_UP_TIME As Integer = 3000      ' Minimum time between gain increases

Dim VOICE_THRESHOLD As Double = 0.1     ' 0.1 ~ -20dB; meterF1 value to consider as voice present
Dim VOICE_DURATION As Integer = 250     ' Time of continuous voice detection to consider as speaking
Dim VOICE_WAIT As Integer = 5000        ' If there is no voice for this time, script stops adjusting gain

' ====== Timestamps ======
Dim now As Double = 0
Dim peakTimestamp As Double = 0         ' When input last reached PEAK_THRESHOLD
Dim voiceThresholdTimestamp As Double = 0  ' When input made sound above VOICE_THRESHOLD
Dim voiceTimestamp As Double = 0        ' When input continuously spoke above VOICE_THRESHOLD for VOICE_DURATION
Dim gainDownTimestamp As Double = 0     ' When gain was last decreased
Dim gainUpTimestamp As Double = 0       ' When gain was last increased

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
            Console.WriteLine(timestamp & " AutoGain | No inputs have 'AutoGain' in the name or have Audio or VideoCall type.")
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

        If meterF1 > PEAK_THRESHOLD Then
            peakTimestamp = now
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

        If now - peakTimestamp > PEAK_WAIT And now - gainUpTimestamp > GAIN_UP_TIME Then
            ' Increase gain if no peaks detected for PEAK_WAIT
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Min(gainDb + 1, 24)))
            gainUpTimestamp = now
        End If

        If meterF1 > CLIP_THRESHOLD And now - gainDownTimestamp > GAIN_DOWN_TIME Then
            ' Decrease gain to prevent clipping
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Max(gainDb - 1, 0)))
            gainDownTimestamp = now
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AutoGain | Unexpected error: " & ex.Message)
    End Try
Loop
