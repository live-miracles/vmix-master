' Script name: AutoGain
'
' It monitors the input which has AutoGain in the name or has type Audio or VideoCall
' and automatically adjusts the gain to prevent clipping or low volume.
' It keeps the average level of the voice at the target level, so the voice
' stays equally loud whether the speaker moves closer, further away, or speaks
' louder or softer. A clip lowers the gain at once.
' You can configure the target level and the thresholds below.
'
' Decibels = 20 * Math.Log10(Amplitude)

Dim SCRIPT_NAME As String = "auto-gain"
Dim SCRIPT_VERSION As String = "1.3.0"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AutoGain " & SCRIPT_VERSION)

' ===== Configurations =====
Dim LOOP_TIME As Integer = 50           ' Wait time between each loop iteration in ms

Dim TARGET_LEVEL_DB As Double = -14     ' Average voice level (dB) to aim for
Dim TOLERANCE_DB As Double = 2          ' The gain is kept while the average is within this many dB of the target
Dim AVERAGE_TIME As Integer = 10000     ' Time constant of the average level in ms; longer is steadier but slower
Dim AVERAGE_THRESHOLD_DB As Double = -30 ' meterF1 level in dB below which values are left out of the average

Dim CLIP_THRESHOLD_DB As Double = -1    ' meterF1 level in dB to consider as clipping
Dim CLIP_WAIT As Integer = 5000         ' Time to wait after the last clip before allowing gain increase
Dim GAIN_DOWN_TIME As Integer = 1000    ' Minimum time between gain decreases
Dim GAIN_UP_TIME As Integer = 3000      ' Minimum time between gain increases

Dim VOICE_THRESHOLD_DB As Double = -20  ' meterF1 level in dB to consider as voice present (-20 dB is 0.1 amplitude)
Dim VOICE_DURATION As Integer = 250     ' Time of continuous voice detection to consider as speaking
Dim VOICE_WAIT As Integer = 5000        ' If there is no voice for this time, script stops adjusting gain

' meterF1 is an amplitude: amplitude = 10 ^ (dB / 20)
Dim AVERAGE_THRESHOLD As Double = Math.Pow(10, AVERAGE_THRESHOLD_DB / 20)
Dim CLIP_THRESHOLD As Double = Math.Pow(10, CLIP_THRESHOLD_DB / 20)
Dim VOICE_THRESHOLD As Double = Math.Pow(10, VOICE_THRESHOLD_DB / 20)

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

' ====== Timestamps ======
Dim now As Double = 0
Dim lastLoopTimestamp As Double = 0     ' When the previous loop iteration read the level
Dim clipTimestamp As Double = 0         ' When input last reached CLIP_THRESHOLD
Dim voiceThresholdTimestamp As Double = 0  ' When input made sound above VOICE_THRESHOLD
Dim voiceTimestamp As Double = 0        ' When input continuously spoke above VOICE_THRESHOLD for VOICE_DURATION
Dim gainDownTimestamp As Double = 0     ' When gain was last decreased
Dim gainUpTimestamp As Double = 0       ' When gain was last increased

Dim averageLevel As Double = 0          ' Moving average of meterF1 while the voice is present, 0 if unknown

Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(LOOP_TIME)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())
        now = (DateTime.Now - New DateTime(2000, 1, 1)).TotalMilliseconds
        Dim elapsed As Double = LOOP_TIME
        If lastLoopTimestamp > 0 Then
            elapsed = now - lastLoopTimestamp
        End If
        lastLoopTimestamp = now

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

        If meterF1 > CLIP_THRESHOLD Then
            clipTimestamp = now
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

        ' Average the level over the voice, so peaks and pauses do not decide the gain
        If meterF1 > AVERAGE_THRESHOLD Then
            If averageLevel = 0 Then
                averageLevel = meterF1
            Else
                averageLevel += (1 - Math.Exp(-elapsed / AVERAGE_TIME)) * (meterF1 - averageLevel)
            End If
        End If

        Dim gainChange As Integer = 0
        Dim averageDb As Double = -100
        If averageLevel > 0 Then
            averageDb = 20 * Math.Log10(averageLevel)
        End If

        If meterF1 > CLIP_THRESHOLD And now - gainDownTimestamp > GAIN_DOWN_TIME Then
            ' Decrease gain to prevent clipping
            gainChange = -1
        ElseIf averageDb > TARGET_LEVEL_DB + TOLERANCE_DB And now - gainDownTimestamp > GAIN_DOWN_TIME Then
            ' Decrease gain, the voice is louder than the target
            gainChange = -1
        ElseIf averageLevel > 0 And averageDb < TARGET_LEVEL_DB - TOLERANCE_DB And now - clipTimestamp > CLIP_WAIT And now - gainUpTimestamp > GAIN_UP_TIME Then
            ' Increase gain, the voice is quieter than the target and has not clipped for CLIP_WAIT
            gainChange = 1
        End If

        If gainChange <> 0 Then
            Dim newGainDb As Integer = Math.Max(Math.Min(gainDb + gainChange, 24), 0)
            If newGainDb <> gainDb Then
                API.Function("SetGain", Input:=inputNumber, Value:=CStr(newGainDb))
                ' The meter is after the gain, so the average moves with it
                averageLevel = averageLevel * Math.Pow(10, (newGainDb - gainDb) / 20)
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " AutoGain | Gain " & gainDb & " -> " & newGainDb & " dB, average level " & averageDb.ToString("0.0") & " dB")
            End If
            If gainChange < 0 Then
                gainDownTimestamp = now
            Else
                gainUpTimestamp = now
            End If
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AutoGain | Unexpected error: " & ex.Message)
    End Try
Loop
